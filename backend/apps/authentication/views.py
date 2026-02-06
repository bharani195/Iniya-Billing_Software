from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import models
from .models import User
from .serializers import (
    UserSerializer, UserCreateSerializer, LoginSerializer,
    PasswordChangeSerializer, PasswordResetRequestSerializer, PasswordResetSerializer
)


class LoginView(APIView):
    """User login endpoint"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Login successful',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })


class LogoutView(APIView):
    """User logout endpoint"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': 'Logout successful'})
        except Exception:
            return Response({'message': 'Logout successful'})


class ProfileView(APIView):
    """User profile management"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class PasswordChangeView(APIView):
    """Change user password"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {'error': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({'message': 'Password changed successfully'})


class PasswordResetView(APIView):
    """Reset password without authentication (for forgot password)"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Password reset successfully'})


class UserViewSet(viewsets.ModelViewSet):
    """Admin user management"""
    queryset = User.objects.all().order_by('-created_at')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        return queryset
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle user active status"""
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response({
            'message': f"User {'activated' if user.is_active else 'deactivated'}",
            'is_active': user.is_active
        })
    
    @action(detail=False, methods=['get'])
    def staff(self, request):
        """Get staff users for worker assignment dropdown"""
        staff_users = User.objects.filter(role='staff', is_active=True)
        data = [
            {'id': u.id, 'name': u.full_name, 'username': u.username}
            for u in staff_users
        ]
        return Response(data)


class DashboardStatsView(APIView):
    """Dashboard statistics for current user"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from apps.invoices.models import Invoice
        from apps.customers.models import Customer
        from apps.products.models import Product
        from apps.payments.models import Payment
        from django.db.models import Sum
        from django.utils import timezone
        
        today = timezone.now().date()
        month_start = today.replace(day=1)
        
        # Today's sales
        today_sales = Invoice.objects.filter(
            invoice_date=today
        ).aggregate(total=Sum('total'))['total'] or 0
        
        # Monthly sales
        monthly_sales = Invoice.objects.filter(
            invoice_date__gte=month_start
        ).aggregate(total=Sum('total'))['total'] or 0
        
        # Pending payments
        pending_amount = Invoice.objects.filter(
            status__in=['pending', 'partial']
        ).aggregate(total=Sum('balance'))['total'] or 0
        
        # Counts
        total_customers = Customer.objects.count()
        total_products = Product.objects.count()
        low_stock_count = Product.objects.filter(
            quantity__lte=models.F('min_stock')
        ).count()
        
        # Recent activity
        recent_invoices = Invoice.objects.order_by('-created_at')[:5].values(
            'invoice_number', 'customer__name', 'total', 'status', 'invoice_date'
        )
        
        return Response({
            'today_sales': float(today_sales),
            'monthly_sales': float(monthly_sales),
            'pending_amount': float(pending_amount),
            'total_customers': total_customers,
            'total_products': total_products,
            'low_stock_count': low_stock_count,
            'recent_invoices': list(recent_invoices),
        })


# Import models for DashboardStatsView
