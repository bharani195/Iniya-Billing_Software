from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum
from .models import Supplier
from .serializers import SupplierSerializer, SupplierListSerializer


class SupplierViewSet(viewsets.ModelViewSet):
    """ViewSet for Supplier CRUD operations"""
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(phone__icontains=search) |
                Q(gstin__icontains=search)
            )
        
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset.order_by('name')
    
    @action(detail=False, methods=['get'])
    def dropdown(self, request):
        """Get suppliers for dropdown"""
        suppliers = Supplier.objects.filter(is_active=True).order_by('name')
        serializer = SupplierListSerializer(suppliers, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get supplier statistics"""
        total = Supplier.objects.count()
        active = Supplier.objects.filter(is_active=True).count()
        total_payable = Supplier.objects.aggregate(total=Sum('current_balance'))['total'] or 0
        
        return Response({
            'total_suppliers': total,
            'active_suppliers': active,
            'total_payable': float(total_payable),
        })
