from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from django.utils import timezone
from .models import Purchase, Expense
from .serializers import PurchaseSerializer, PurchaseListSerializer, ExpenseSerializer


class PurchaseViewSet(viewsets.ModelViewSet):
    """ViewSet for Purchase CRUD"""
    queryset = Purchase.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PurchaseListSerializer
        return PurchaseSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        supplier = self.request.query_params.get('supplier')
        if supplier:
            queryset = queryset.filter(supplier_id=supplier)
        
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset.order_by('-purchase_date', '-id')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        today = timezone.now().date()
        month_start = today.replace(day=1)
        
        monthly_purchases = Purchase.objects.filter(
            purchase_date__gte=month_start
        ).exclude(status='cancelled').aggregate(total=Sum('total'))['total'] or 0
        
        total_payable = Purchase.objects.filter(
            status__in=['pending', 'partial']
        ).aggregate(total=Sum('balance'))['total'] or 0
        
        return Response({
            'monthly_purchases': float(monthly_purchases),
            'total_payable': float(total_payable),
        })


class ExpenseViewSet(viewsets.ModelViewSet):
    """ViewSet for Expense CRUD"""
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        start_date = self.request.query_params.get('start_date')
        if start_date:
            queryset = queryset.filter(expense_date__gte=start_date)
        
        end_date = self.request.query_params.get('end_date')
        if end_date:
            queryset = queryset.filter(expense_date__lte=end_date)
        
        return queryset.order_by('-expense_date', '-id')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        today = timezone.now().date()
        month_start = today.replace(day=1)
        
        monthly_expenses = Expense.objects.filter(
            expense_date__gte=month_start
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        category_breakdown = Expense.objects.filter(
            expense_date__gte=month_start
        ).values('category').annotate(total=Sum('amount'))
        
        return Response({
            'monthly_expenses': float(monthly_expenses),
            'category_breakdown': list(category_breakdown),
        })
