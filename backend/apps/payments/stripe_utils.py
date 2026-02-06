"""Stripe Payment Gateway Integration"""

import stripe
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


def create_checkout_session(invoice, success_url, cancel_url):
    """
    Create a Stripe Checkout Session for invoice payment
    
    Args:
        invoice: Invoice model instance
        success_url: URL to redirect on successful payment
        cancel_url: URL to redirect on payment cancellation
    
    Returns:
        dict: {'success': bool, 'checkout_url': str or None, 'session_id': str or None, 'error': str or None}
    """
    try:
        # Calculate balance in paise (Stripe uses smallest currency unit)
        amount_in_paise = int(float(invoice.balance) * 100)
        
        # Create Stripe Checkout Session
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'inr',
                    'unit_amount': amount_in_paise,
                    'product_data': {
                        'name': f'Invoice {invoice.invoice_number}',
                        'description': f'Payment for {invoice.customer.name}',
                    },
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=invoice.customer.email if invoice.customer and invoice.customer.email else None,
            metadata={
                'invoice_id': str(invoice.id),
                'invoice_number': invoice.invoice_number,
                'payment_token': invoice.payment_token or '',
            },
            payment_intent_data={
                'metadata': {
                    'invoice_id': str(invoice.id),
                    'invoice_number': invoice.invoice_number,
                }
            }
        )
        
        logger.info(f"Created Stripe checkout session for invoice {invoice.invoice_number}: {session.id}")
        
        return {
            'success': True,
            'checkout_url': session.url,
            'session_id': session.id,
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error for invoice {invoice.invoice_number}: {str(e)}")
        return {
            'success': False,
            'error': str(e),
        }
    except Exception as e:
        logger.error(f"Error creating checkout session: {str(e)}")
        return {
            'success': False,
            'error': str(e),
        }


def handle_successful_payment(session_data):
    """
    Handle successful payment from Stripe webhook or session verification
    
    Args:
        session_data: Stripe checkout session data (dict or object)
    
    Returns:
        dict: {'success': bool, 'message': str}
    """
    from apps.invoices.models import Invoice
    from apps.payments.models import Payment
    from apps.settings.models import Notification
    
    print(f"[DEBUG] handle_successful_payment called")
    print(f"[DEBUG] session_data type: {type(session_data)}")
    
    try:
        # Get invoice ID from metadata
        if isinstance(session_data, dict):
            print(f"[DEBUG] Session is dict, metadata: {session_data.get('metadata', {})}")
            invoice_id = session_data.get('metadata', {}).get('invoice_id')
            amount_total = session_data.get('amount_total', 0)
            payment_intent = session_data.get('payment_intent', '')
            session_id = session_data.get('id', '')
        else:
            print(f"[DEBUG] Session is object, metadata: {session_data.metadata}")
            invoice_id = session_data.metadata.get('invoice_id')
            amount_total = session_data.amount_total
            payment_intent = session_data.payment_intent
            session_id = session_data.id
        
        print(f"[DEBUG] Extracted: invoice_id={invoice_id}, amount_total={amount_total}, payment_intent={payment_intent}")
        
        if not invoice_id:
            print(f"[DEBUG] No invoice_id found in metadata!")
            return {'success': False, 'message': 'No invoice ID in session metadata'}
        
        invoice = Invoice.objects.select_related('customer').get(id=invoice_id)
        print(f"[DEBUG] Found invoice: {invoice.invoice_number}")
        
        # Get payment amount (in rupees)
        amount_paid = amount_total / 100
        print(f"[DEBUG] Amount paid: {amount_paid}")
        
        # Check if payment already recorded (avoid duplicates) - use 'reference' field
        if Payment.objects.filter(reference=payment_intent).exists():
            print(f"[DEBUG] Payment already exists with reference: {payment_intent}")
            return {'success': True, 'message': 'Payment already recorded'}
        
        # Create payment record with correct field names
        from datetime import date
        print(f"[DEBUG] Creating Payment record...")
        payment = Payment.objects.create(
            invoice=invoice,
            customer=invoice.customer,  # Required field
            amount=amount_paid,
            mode='card',  # Field is 'mode' not 'payment_method'
            payment_date=date.today(),  # Required field
            reference=payment_intent,  # Field is 'reference' not 'reference_number'
            notes=f'Stripe Online Payment - Session: {session_id}'
        )
        print(f"[DEBUG] Payment created: ID={payment.id}")
        
        # Update invoice received amount (use Decimal for consistency)
        from decimal import Decimal
        invoice.received = invoice.received + Decimal(str(amount_paid))
        invoice.save()  # This will auto-update balance and status
        print(f"[DEBUG] Invoice updated: received={invoice.received}, balance={invoice.balance}, status={invoice.status}")
        
        # Create notification for admin
        Notification.create_payment_notification(invoice, payment, amount_paid)
        print(f"[DEBUG] Notification created")
        
        logger.info(f"Payment of ₹{amount_paid} recorded for invoice {invoice.invoice_number}")
        
        return {
            'success': True,
            'message': f'Payment of ₹{amount_paid} recorded for invoice {invoice.invoice_number}'
        }
        
    except Invoice.DoesNotExist:
        print(f"[ERROR] Invoice not found for ID: {invoice_id}")
        logger.error(f"Invoice not found for payment")
        return {'success': False, 'message': 'Invoice not found'}
    except Exception as e:
        print(f"[ERROR] Exception in handle_successful_payment: {e}")
        import traceback
        traceback.print_exc()
        logger.error(f"Error handling payment: {str(e)}")
        return {'success': False, 'message': str(e)}


def verify_payment_session(session_id):
    """
    Verify payment session status and process if paid
    
    Args:
        session_id: Stripe session ID
    
    Returns:
        dict: Session status and processing result
    """
    try:
        print(f"[DEBUG] Verifying session: {session_id}")
        session = stripe.checkout.Session.retrieve(session_id)
        print(f"[DEBUG] Session retrieved: payment_status={session.payment_status}, amount={session.amount_total}")
        
        result = {
            'success': True,
            'payment_status': session.payment_status,
            'amount_total': session.amount_total / 100,
        }
        
        # If payment is complete, process it
        if session.payment_status == 'paid':
            print(f"[DEBUG] Payment is PAID - processing...")
            payment_result = handle_successful_payment(session)
            print(f"[DEBUG] handle_successful_payment result: {payment_result}")
            result['payment_processed'] = payment_result
        else:
            print(f"[DEBUG] Payment status is not 'paid': {session.payment_status}")
        
        return result
        
    except stripe.error.StripeError as e:
        print(f"[ERROR] Stripe error in verify_payment_session: {e}")
        logger.error(f"Stripe error verifying session: {e}")
        return {'success': False, 'error': str(e)}
    except Exception as e:
        print(f"[ERROR] Exception in verify_payment_session: {e}")
        import traceback
        traceback.print_exc()
        return {'success': False, 'error': str(e)}

