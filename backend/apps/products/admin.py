from django.contrib import admin
from .models import Category, Product, StockMovement


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    search_fields = ['name']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'sku', 'category', 'sale_price', 'quantity', 'gst_rate', 'is_active']
    list_filter = ['category', 'is_active', 'gst_rate']
    search_fields = ['name', 'sku', 'barcode']
    ordering = ['name']


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ['product', 'movement_type', 'quantity', 'previous_quantity', 'new_quantity', 'created_at']
    list_filter = ['movement_type', 'created_at']
    search_fields = ['product__name', 'reference']
