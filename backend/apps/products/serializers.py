from rest_framework import serializers
from .models import Category, Product, StockMovement


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category"""
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = '__all__'
        read_only_fields = ['id', 'created_at']
    
    def get_product_count(self, obj):
        return obj.products.count()


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_low_stock = serializers.ReadOnlyField()
    stock_value = serializers.ReadOnlyField()
    
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductListSerializer(serializers.ModelSerializer):
    """Light serializer for dropdowns and lists"""
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'sku', 'sale_price', 'gst_rate', 'quantity', 'unit']


class ProductStockSerializer(serializers.ModelSerializer):
    """Serializer for stock updates"""
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'quantity', 'min_stock', 'max_stock']


class StockMovementSerializer(serializers.ModelSerializer):
    """Serializer for Stock Movement"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = StockMovement
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'previous_quantity', 'new_quantity']
