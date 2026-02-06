from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum
from django.utils import timezone
from .models import Payment, PaymentOut
from .serializers import PaymentSerializer, PaymentListSerializer, PaymentOutSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for Payment In (Customer collections)"""
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(customer__name__icontains=search) |
                Q(reference__icontains=search)
            )
        
        customer = self.request.query_params.get('customer')
        if customer:
            queryset = queryset.filter(customer_id=customer)
        
        mode = self.request.query_params.get('mode')
        if mode:
            queryset = queryset.filter(mode=mode)
        
        start_date = self.request.query_params.get('start_date')
        if start_date:
            queryset = queryset.filter(payment_date__gte=start_date)
        
        end_date = self.request.query_params.get('end_date')
        if end_date:
            queryset = queryset.filter(payment_date__lte=end_date)
        
        return queryset.order_by('-payment_date', '-id')
    
    def perform_create(self, serializer):
        payment = serializer.save(created_by=self.request.user)
        
        # Create notification for payment received
        from apps.settings.models import Notification
        customer_name = payment.customer.name if payment.customer else 'Unknown'
        invoice_number = payment.invoice.invoice_number if payment.invoice else 'N/A'
        
        Notification.objects.create(
            type='payment',
            title=f'Payment Received - {invoice_number}',
            message=f'₹{payment.amount:,.2f} received from {customer_name} via {payment.get_mode_display()}',
            link='/payments',
            invoice_id=payment.invoice.id if payment.invoice else None,
            payment_id=payment.id,
            amount=payment.amount
        )
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get payment statistics"""
        today = timezone.now().date()
        month_start = today.replace(day=1)
        
        today_collections = Payment.objects.filter(
            payment_date=today
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        monthly_collections = Payment.objects.filter(
            payment_date__gte=month_start
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Payment mode breakdown
        mode_breakdown = Payment.objects.filter(
            payment_date__gte=month_start
        ).values('mode').annotate(total=Sum('amount'))
        
        return Response({
            'today_collections': float(today_collections),
            'monthly_collections': float(monthly_collections),
            'mode_breakdown': list(mode_breakdown),
        })
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent payments"""
        limit = int(request.query_params.get('limit', 10))
        payments = Payment.objects.order_by('-created_at')[:limit]
        return Response(PaymentListSerializer(payments, many=True).data)


class PaymentOutViewSet(viewsets.ModelViewSet):
    """ViewSet for Payment Out (Supplier payments)"""
    queryset = PaymentOut.objects.all()
    serializer_class = PaymentOutSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        supplier = self.request.query_params.get('supplier')
        if supplier:
            queryset = queryset.filter(supplier_id=supplier)
        
        return queryset.order_by('-payment_date', '-id')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
