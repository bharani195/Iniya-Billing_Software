from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum
from django.db.models import ProtectedError
from .models import Customer
from .serializers import CustomerSerializer, CustomerListSerializer, CustomerDetailSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    """ViewSet for Customer CRUD operations"""
    queryset = Customer.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CustomerSerializer
        if self.action == 'retrieve':
            return CustomerDetailSerializer
        return CustomerSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Search filter
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(phone__icontains=search) |
                Q(email__icontains=search) |
                Q(gstin__icontains=search)
            )
        
        # Active filter
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Balance filter (due customers)
        has_due = self.request.query_params.get('has_due')
        if has_due and has_due.lower() == 'true':
            queryset = queryset.filter(current_balance__gt=0)
        
        return queryset.order_by('name')
    
    def destroy(self, request, *args, **kwargs):
        """Delete customer - handle protected references gracefully"""
        customer = self.get_object()
        try:
            customer.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProtectedError:
            return Response(
                {'error': 'Cannot delete customer with existing invoices or payments. Remove linked records first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def dropdown(self, request):
        """Get customers for dropdown selection"""
        customers = Customer.objects.filter(is_active=True).order_by('name')
        serializer = CustomerListSerializer(customers, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def with_dues(self, request):
        """Get customers with pending dues"""
        customers = Customer.objects.filter(current_balance__gt=0).order_by('-current_balance')
        serializer = CustomerSerializer(customers, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def ledger(self, request, pk=None):
        """Get customer ledger/transaction history"""
        customer = self.get_object()
        
        from apps.invoices.models import Invoice
        from apps.payments.models import Payment
        
        invoices = Invoice.objects.filter(customer=customer).values(
            'id', 'invoice_number', 'invoice_date', 'total', 'balance', 'status'
        )
        
        payments = Payment.objects.filter(customer=customer).values(
            'id', 'payment_date', 'amount', 'mode', 'reference'
        )
        
        return Response({
            'customer': CustomerSerializer(customer).data,
            'invoices': list(invoices),
            'payments': list(payments),
            'total_invoiced': customer.invoices.aggregate(total=Sum('total'))['total'] or 0,
            'total_paid': customer.payments.aggregate(total=Sum('amount'))['total'] or 0,
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get customer statistics"""
        total = Customer.objects.count()
        active = Customer.objects.filter(is_active=True).count()
        with_dues = Customer.objects.filter(current_balance__gt=0).count()
        total_dues = Customer.objects.aggregate(total=Sum('current_balance'))['total'] or 0
        
        return Response({
            'total_customers': total,
            'active_customers': active,
            'customers_with_dues': with_dues,
            'total_dues_amount': float(total_dues),
        })
