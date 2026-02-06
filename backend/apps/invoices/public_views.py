"""Public payment views - No authentication required"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Invoice


class PublicInvoicePaymentView(APIView):
    """
    Public endpoint for customer payment page
    No authentication required - uses token for security
    """
    permission_classes = [AllowAny]
    
    def get(self, request, invoice_id, token):
        """Get invoice details for payment page"""
        try:
            invoice = Invoice.objects.select_related('customer').get(
                id=invoice_id,
                payment_token=token
            )
        except Invoice.DoesNotExist:
            return Response(
                {'error': 'Invalid payment link'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get company info
        from apps.company.models import Company
        company = Company.get_default()
        
        return Response({
            'invoice': {
                'id': invoice.id,
                'invoice_number': invoice.invoice_number,
                'invoice_date': invoice.invoice_date,
                'due_date': invoice.due_date,
                'total': float(invoice.total),
                'received': float(invoice.received),
                'balance': float(invoice.balance),
                'status': invoice.status,
            },
            'customer': {
                'name': invoice.customer.name if invoice.customer else 'Unknown',
            },
            'company': {
                'name': company.name,
                'phone': company.phone,
                'email': company.email,
            },
            'is_paid': invoice.balance <= 0,
        })
    
    def post(self, request, invoice_id, token):
        """Create Stripe checkout session for payment"""
        import traceback
        
        try:
            invoice = Invoice.objects.select_related('customer').get(
                id=invoice_id,
                payment_token=token
            )
        except Invoice.DoesNotExist:
            return Response(
                {'error': 'Invalid payment link'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if invoice.balance <= 0:
            return Response(
                {'error': 'Invoice is already paid'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from apps.payments.stripe_utils import create_checkout_session
            
            # Get frontend URL from request or use default
            frontend_url = request.data.get('frontend_url', 'http://localhost:5173')
            success_url = f"{frontend_url}/pay/{invoice_id}/{token}/success?session_id={{CHECKOUT_SESSION_ID}}"
            cancel_url = f"{frontend_url}/pay/{invoice_id}/{token}"
            
            result = create_checkout_session(invoice, success_url, cancel_url)
            
            if result['success']:
                return Response({
                    'checkout_url': result['checkout_url'],
                    'session_id': result['session_id'],
                })
            else:
                return Response(
                    {'error': result.get('error', 'Failed to create payment session')},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        except Exception as e:
            traceback.print_exc()
            return Response(
                {'error': f'Payment error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PaymentSuccessView(APIView):
    """Handle payment success callback"""
    permission_classes = [AllowAny]
    
    def get(self, request, invoice_id, token):
        """Verify payment and return status"""
        from apps.payments.stripe_utils import verify_payment_session
        
        print(f"[DEBUG] PaymentSuccessView.get called!")
        print(f"[DEBUG] invoice_id={invoice_id}, token={token}")
        
        session_id = request.query_params.get('session_id')
        print(f"[DEBUG] session_id={session_id}")
        
        if not session_id:
            print(f"[DEBUG] Missing session_id!")
            return Response(
                {'error': 'Missing session ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            invoice = Invoice.objects.get(
                id=invoice_id,
                payment_token=token
            )
            print(f"[DEBUG] Found invoice: {invoice.invoice_number}")
        except Invoice.DoesNotExist:
            print(f"[DEBUG] Invoice not found!")
            return Response(
                {'error': 'Invalid payment link'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify payment with Stripe
        print(f"[DEBUG] Calling verify_payment_session...")
        result = verify_payment_session(session_id)
        print(f"[DEBUG] verify_payment_session result: {result}")
        
        if result.get('success') and result.get('payment_status') == 'paid':
            # Refresh invoice from DB
            invoice.refresh_from_db()
            
            return Response({
                'success': True,
                'message': 'Payment successful!',
                'invoice': {
                    'invoice_number': invoice.invoice_number,
                    'total': float(invoice.total),
                    'received': float(invoice.received),
                    'balance': float(invoice.balance),
                    'status': invoice.status,
                }
            })
        else:
            return Response({
                'success': False,
                'message': result.get('error', 'Payment verification failed'),
            })

