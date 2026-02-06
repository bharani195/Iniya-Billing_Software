"""Email utility for sending invoices with PDF attachments"""

from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.conf import settings
from io import BytesIO
import logging

logger = logging.getLogger(__name__)


def send_invoice_email(invoice, pdf_buffer):
    """
    Send invoice PDF to customer via email
    
    Args:
        invoice: Invoice model instance
        pdf_buffer: BytesIO buffer containing the PDF
    
    Returns:
        dict: {'success': bool, 'message': str}
    """
    
    # Get customer email
    customer_email = invoice.customer.email if invoice.customer else None
    
    if not customer_email:
        return {
            'success': False, 
            'message': 'Customer email address not found'
        }
    
    # Get company info
    from apps.company.models import Company
    company = Company.get_default()
    
    # Prepare email content
    subject = f"Invoice {invoice.invoice_number} from {company.name}"
    
    # Generate payment link if balance > 0
    payment_url = invoice.get_payment_url() if invoice.balance > 0 else None
    
    # Pay Now button HTML
    pay_button_html = ""
    if payment_url and invoice.balance > 0:
        pay_button_html = f"""
            <div style="text-align: center; margin: 30px 0;">
                <a href="{payment_url}" 
                   style="display: inline-block; background: linear-gradient(135deg, #10B981, #059669); 
                          color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; 
                          font-size: 18px; font-weight: bold; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
                    💳 Pay Now - ₹{invoice.balance:,.2f}
                </a>
                <p style="margin-top: 10px; font-size: 12px; color: #666;">Click the button above to pay securely via Stripe</p>
            </div>
        """
    
    # Build HTML email body
    email_body = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .header {{ background: linear-gradient(135deg, #1E3A5F, #2C5282); color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 30px; }}
            .invoice-details {{ background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }}
            .amount {{ font-size: 24px; color: #1E3A5F; font-weight: bold; }}
            .footer {{ background: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>{company.name}</h1>
            <p>Invoice Notification</p>
        </div>
        
        <div class="content">
            <p>Dear <strong>{invoice.customer.name}</strong>,</p>
            
            <p>Please find attached your invoice from {company.name}.</p>
            
            <div class="invoice-details">
                <table style="width: 100%;">
                    <tr>
                        <td><strong>Invoice Number:</strong></td>
                        <td>{invoice.invoice_number}</td>
                    </tr>
                    <tr>
                        <td><strong>Invoice Date:</strong></td>
                        <td>{invoice.invoice_date.strftime('%d %b %Y')}</td>
                    </tr>
                    <tr>
                        <td><strong>Due Date:</strong></td>
                        <td>{invoice.due_date.strftime('%d %b %Y') if invoice.due_date else 'On Receipt'}</td>
                    </tr>
                    <tr>
                        <td><strong>Total Amount:</strong></td>
                        <td class="amount">₹{invoice.total:,.2f}</td>
                    </tr>
                    <tr>
                        <td><strong>Balance Due:</strong></td>
                        <td style="color: {'#dc2626' if invoice.balance > 0 else '#16a34a'}; font-weight: bold;">
                            ₹{invoice.balance:,.2f}
                        </td>
                    </tr>
                </table>
            </div>
            
            {pay_button_html}
            
            <p>The invoice PDF is attached to this email for your records.</p>
            
            <p>If you have any questions regarding this invoice, please don't hesitate to contact us.</p>
            
            <p>Thank you for your business!</p>
            
            <p>Best regards,<br>
            <strong>{company.name}</strong><br>
            Phone: {company.phone}<br>
            Email: {company.email}</p>
        </div>
        
        <div class="footer">
            <p>This is an automated email from {company.name}.</p>
            <p>{company.address}, {company.city} - {company.pincode}</p>
        </div>
    </body>
    </html>
    """
    
    try:
        # Create email message
        email = EmailMessage(
            subject=subject,
            body=email_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[customer_email],
            reply_to=[company.email] if company.email else None,
        )
        
        # Set content type to HTML
        email.content_subtype = 'html'
        
        # Attach PDF
        pdf_buffer.seek(0)
        email.attach(
            filename=f"Invoice_{invoice.invoice_number}.pdf",
            content=pdf_buffer.read(),
            mimetype='application/pdf'
        )
        
        # Send email
        email.send(fail_silently=False)
        
        logger.info(f"Invoice {invoice.invoice_number} sent to {customer_email}")
        
        return {
            'success': True,
            'message': f'Invoice sent successfully to {customer_email}'
        }
        
    except Exception as e:
        logger.error(f"Failed to send invoice email: {str(e)}")
        return {
            'success': False,
            'message': f'Failed to send email: {str(e)}'
        }
