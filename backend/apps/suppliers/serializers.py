from rest_framework import serializers
from .models import Supplier


class SupplierSerializer(serializers.ModelSerializer):
    """Serializer for Supplier model"""
    
    class Meta:
        model = Supplier
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class SupplierListSerializer(serializers.ModelSerializer):
    """Light serializer for dropdown"""
    
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'phone', 'gstin', 'current_balance']
