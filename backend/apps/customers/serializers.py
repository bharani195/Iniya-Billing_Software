from rest_framework import serializers
from django.db.models import Sum, Count
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    """Serializer for Customer model"""
    total_invoices = serializers.SerializerMethodField()
    total_purchases = serializers.SerializerMethodField()
    
    class Meta:
        model = Customer
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_total_invoices(self, obj):
        return obj.invoices.count() if hasattr(obj, 'invoices') else 0
    
    def get_total_purchases(self, obj):
        result = obj.invoices.aggregate(total=Sum('total')) if hasattr(obj, 'invoices') else {'total': 0}
        return float(result['total'] or 0)


class CustomerListSerializer(serializers.ModelSerializer):
    """Light serializer for customer dropdown lists"""
    
    class Meta:
        model = Customer
        fields = ['id', 'name', 'phone', 'gstin', 'current_balance']


class CustomerDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer with transaction history"""
    invoices = serializers.SerializerMethodField()
    payments = serializers.SerializerMethodField()
    
    class Meta:
        model = Customer
        fields = '__all__'
    
    def get_invoices(self, obj):
        from apps.invoices.serializers import InvoiceListSerializer
        invoices = obj.invoices.order_by('-invoice_date')[:10]
        return InvoiceListSerializer(invoices, many=True).data
    
    def get_payments(self, obj):
        from apps.payments.serializers import PaymentListSerializer
        payments = obj.payments.order_by('-payment_date')[:10]
        return PaymentListSerializer(payments, many=True).data
