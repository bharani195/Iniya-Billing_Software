from rest_framework import serializers
from .models import Purchase, PurchaseItem, Expense


class PurchaseItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseItem
        fields = '__all__'
        read_only_fields = ['id', 'tax_amount', 'total']


class PurchaseSerializer(serializers.ModelSerializer):
    items = PurchaseItemSerializer(many=True, read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    
    class Meta:
        model = Purchase
        fields = '__all__'
        read_only_fields = ['id', 'balance', 'created_at', 'updated_at']


class PurchaseListSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    
    class Meta:
        model = Purchase
        fields = ['id', 'purchase_number', 'bill_number', 'purchase_date', 
                  'supplier', 'supplier_name', 'total', 'paid', 'balance', 'status']


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ['id', 'created_at']
