from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum, F
from .models import Category, Product, StockMovement
from .serializers import (
    CategorySerializer, ProductSerializer, ProductListSerializer,
    ProductStockSerializer, StockMovementSerializer
)


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for Category CRUD"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset


class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet for Product CRUD with stock management"""
    queryset = Product.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProductSerializer
        if self.action in ['dropdown', 'search']:
            return ProductListSerializer
        return ProductSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(sku__icontains=search) |
                Q(barcode__icontains=search)
            )
        
        # Category filter
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category_id=category)
        
        # Active filter
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Low stock filter
        low_stock = self.request.query_params.get('low_stock')
        if low_stock and low_stock.lower() == 'true':
            queryset = queryset.filter(quantity__lte=F('min_stock'))
        
        return queryset.order_by('name')
    
    @action(detail=False, methods=['get'])
    def dropdown(self, request):
        """Get products for dropdown selection"""
        products = Product.objects.filter(is_active=True).order_by('name')
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get products with low stock"""
        products = Product.objects.filter(
            quantity__lte=F('min_stock'), 
            is_active=True
        ).order_by('quantity')
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def dead_stock(self, request):
        """Get products not sold in last 30 days"""
        from django.utils import timezone
        from datetime import timedelta
        from apps.invoices.models import InvoiceItem
        
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        
        # Get product IDs sold in last 30 days
        sold_product_ids = InvoiceItem.objects.filter(
            invoice__invoice_date__gte=thirty_days_ago
        ).values_list('product_id', flat=True).distinct()
        
        # Get products not in that list
        dead_stock = Product.objects.filter(
            is_active=True,
            quantity__gt=0
        ).exclude(id__in=sold_product_ids)
        
        serializer = ProductSerializer(dead_stock, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def adjust_stock(self, request, pk=None):
        """Manually adjust stock quantity"""
        product = self.get_object()
        new_quantity = request.data.get('quantity')
        notes = request.data.get('notes', '')
        
        if new_quantity is None:
            return Response({'error': 'Quantity is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            new_quantity = int(new_quantity)
        except ValueError:
            return Response({'error': 'Invalid quantity'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create stock movement record
        StockMovement.objects.create(
            product=product,
            movement_type='ADJ',
            quantity=abs(new_quantity - product.quantity),
            previous_quantity=product.quantity,
            new_quantity=new_quantity,
            notes=notes,
            created_by=request.user
        )
        
        product.quantity = new_quantity
        product.save()
        
        return Response({
            'message': 'Stock adjusted successfully',
            'product': ProductSerializer(product).data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get product/inventory statistics"""
        total_products = Product.objects.filter(is_active=True).count()
        low_stock_count = Product.objects.filter(
            quantity__lte=F('min_stock'),
            is_active=True
        ).count()
        out_of_stock = Product.objects.filter(quantity=0, is_active=True).count()
        total_stock_value = Product.objects.filter(is_active=True).aggregate(
            value=Sum(F('quantity') * F('purchase_price'))
        )['value'] or 0
        
        return Response({
            'total_products': total_products,
            'low_stock_count': low_stock_count,
            'out_of_stock': out_of_stock,
            'total_stock_value': float(total_stock_value),
        })
    
    @action(detail=False, methods=['get'])
    def top_selling(self, request):
        """Get top selling products"""
        from apps.invoices.models import InvoiceItem
        from django.db.models import Sum
        
        limit = int(request.query_params.get('limit', 10))
        
        top_products = InvoiceItem.objects.values('product_id', 'product__name').annotate(
            total_sold=Sum('quantity')
        ).order_by('-total_sold')[:limit]
        
        return Response(list(top_products))


class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing stock movements"""
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        movement_type = self.request.query_params.get('type')
        if movement_type:
            queryset = queryset.filter(movement_type=movement_type)
        
        return queryset.order_by('-created_at')
