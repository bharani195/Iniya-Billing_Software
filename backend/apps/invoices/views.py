from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum
from django.http import HttpResponse
from django.utils import timezone
from decimal import Decimal
from .models import Invoice, InvoiceItem
from .serializers import (
    InvoiceSerializer, InvoiceListSerializer, InvoiceCreateSerializer,
    InvoiceItemSerializer
)


class InvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for Invoice CRUD"""
    queryset = Invoice.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return InvoiceListSerializer
        if self.action == 'create':
            return InvoiceCreateSerializer
        return InvoiceSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(invoice_number__icontains=search) |
                Q(customer__name__icontains=search)
            )
        
        # Status filter
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Type filter
        invoice_type = self.request.query_params.get('type')
        if invoice_type:
            queryset = queryset.filter(invoice_type=invoice_type)
        
        # Date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(invoice_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(invoice_date__lte=end_date)
        
        # Customer filter
        customer = self.request.query_params.get('customer')
        if customer:
            queryset = queryset.filter(customer_id=customer)
        
        return queryset.order_by('-invoice_date', '-id')
    
    def create(self, request, *args, **kwargs):
        serializer = InvoiceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        # Create invoice
        from apps.customers.models import Customer
        customer = Customer.objects.get(id=data['customer_id'])
        
        invoice = Invoice.objects.create(
            invoice_number=Invoice.generate_invoice_number(),
            invoice_type=data['invoice_type'],
            invoice_date=data['invoice_date'],
            due_date=data.get('due_date'),
            customer=customer,
            billing_address=data.get('billing_address', customer.address),
            shipping_address=data.get('shipping_address', ''),
            discount_type=data['discount_type'],
            discount_value=data['discount_value'],
            is_igst=data['is_igst'],
            notes=data.get('notes', ''),
            terms=data.get('terms', ''),
            received=data.get('received', 0),
            created_by=request.user
        )
        
        # Create invoice items
        from apps.products.models import Product
        for item_data in data['items']:
            product = None
            if item_data.get('product_id'):
                try:
                    product = Product.objects.get(id=item_data['product_id'])
                except Product.DoesNotExist:
                    pass
            
            InvoiceItem.objects.create(
                invoice=invoice,
                product=product,
                item_name=item_data['item_name'],
                description=item_data.get('description', ''),
                hsn_code=item_data.get('hsn_code', ''),
                quantity=item_data['quantity'],
                unit=item_data.get('unit', 'PCS'),
                price=item_data['price'],
                discount_type=item_data.get('discount_type', 'amount'),
                discount_value=item_data.get('discount_value', 0),
                tax_rate=item_data.get('tax_rate', 0),
            )
            
            # Update stock if product exists
            if product and not product.is_service:
                product.update_stock(int(item_data['quantity']), is_addition=False)
        
        # Calculate totals
        invoice.calculate_totals()
        
        # Update customer balance
        customer.update_balance(invoice.balance, is_debit=True)
        
        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def add_payment(self, request, pk=None):
        """Add payment to invoice"""
        invoice = self.get_object()
        amount = Decimal(str(request.data.get('amount', 0)))
        mode = request.data.get('mode', 'cash')
        reference = request.data.get('reference', '')
        
        if amount <= 0:
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)
        
        if amount > invoice.balance:
            return Response({'error': 'Amount exceeds balance'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create payment record
        from apps.payments.models import Payment
        Payment.objects.create(
            invoice=invoice,
            customer=invoice.customer,
            amount=amount,
            mode=mode,
            reference=reference,
            payment_date=timezone.now().date(),
            created_by=request.user
        )
        
        # Update invoice
        invoice.received += amount
        invoice.save()
        
        # Update customer balance
        invoice.customer.update_balance(amount, is_debit=False)
        
        return Response(InvoiceSerializer(invoice).data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel invoice"""
        invoice = self.get_object()
        
        if invoice.status == 'cancelled':
            return Response({'error': 'Invoice already cancelled'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Restore stock
        from apps.products.models import Product
        for item in invoice.items.all():
            if item.product and not item.product.is_service:
                item.product.update_stock(int(item.quantity), is_addition=True)
        
        # Update customer balance
        invoice.customer.update_balance(invoice.balance, is_debit=False)
        
        invoice.status = 'cancelled'
        invoice.save()
        
        return Response(InvoiceSerializer(invoice).data)
    
    @action(detail=True, methods=['get'])
    def pdf_data(self, request, pk=None):
        """Get invoice data for PDF generation"""
        invoice = self.get_object()
        from apps.company.models import Company
        from apps.company.serializers import CompanySerializer
        
        company = Company.get_default()
        
        return Response({
            'invoice': InvoiceSerializer(invoice).data,
            'company': CompanySerializer(company, context={'request': request}).data,
        })
    
    @action(detail=True, methods=['get'])
    def generate_bill(self, request, pk=None):
        """Generate and download PDF bill for invoice"""
        from django.http import HttpResponse
        from .utils.pdf_generator import generate_invoice_bill
        
        invoice = self.get_object()
        
        try:
            pdf_buffer = generate_invoice_bill(invoice)
        except Exception as e:
            import traceback
            print("ERROR IN PDF GENERATION:")
            traceback.print_exc()
            return Response(
                {'error': f'PDF Generation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Invoice_{invoice.invoice_number}.pdf"'
        
        return response
    
    @action(detail=True, methods=['post'])
    def send_email(self, request, pk=None):
        """Send invoice PDF to customer via email"""
        from .utils.pdf_generator import generate_invoice_bill
        from .utils.email_sender import send_invoice_email
        
        invoice = self.get_object()
        
        # Check if customer has email
        if not invoice.customer or not invoice.customer.email:
            return Response(
                {'error': 'Customer email address not found'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Generate PDF
            pdf_buffer = generate_invoice_bill(invoice)
            
            # Send email
            result = send_invoice_email(invoice, pdf_buffer)
            
            if result['success']:
                return Response({'message': result['message']})
            else:
                return Response(
                    {'error': result['message']},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
                
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Failed to send email: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def next_number(self, request):
        """Get next invoice number"""
        return Response({'invoice_number': Invoice.generate_invoice_number()})
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get invoice statistics"""
        today = timezone.now().date()
        month_start = today.replace(day=1)
        
        total_invoices = Invoice.objects.exclude(status='cancelled').count()
        today_invoices = Invoice.objects.filter(invoice_date=today).exclude(status='cancelled').count()
        
        today_sales = Invoice.objects.filter(
            invoice_date=today
        ).exclude(status='cancelled').aggregate(total=Sum('total'))['total'] or 0
        
        monthly_sales = Invoice.objects.filter(
            invoice_date__gte=month_start
        ).exclude(status='cancelled').aggregate(total=Sum('total'))['total'] or 0
        
        pending_amount = Invoice.objects.filter(
            status__in=['pending', 'partial']
        ).aggregate(total=Sum('balance'))['total'] or 0
        
        return Response({
            'total_invoices': total_invoices,
            'today_invoices': today_invoices,
            'today_sales': float(today_sales),
            'monthly_sales': float(monthly_sales),
            'pending_amount': float(pending_amount),
        })
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent invoices"""
        limit = int(request.query_params.get('limit', 10))
        invoices = Invoice.objects.exclude(status='cancelled').order_by('-created_at')[:limit]
        return Response(InvoiceListSerializer(invoices, many=True).data)
