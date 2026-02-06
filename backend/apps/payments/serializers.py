from rest_framework import serializers
from .models import Payment, PaymentOut


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment"""
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class PaymentListSerializer(serializers.ModelSerializer):
    """Light serializer for payment list"""
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    
    class Meta:
        model = Payment
        fields = ['id', 'customer_name', 'amount', 'mode', 'payment_date', 'reference']


class PaymentOutSerializer(serializers.ModelSerializer):
    """Serializer for PaymentOut"""
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    
    class Meta:
        model = PaymentOut
        fields = '__all__'
        read_only_fields = ['id', 'created_at']
