from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Setting
from .serializers import SettingSerializer


class SettingListView(APIView):
    """List and bulk update settings"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        category = request.query_params.get('category')
        if category:
            settings = Setting.objects.filter(category=category)
        else:
            settings = Setting.objects.all()
        
        # Return as dictionary for easy access
        settings_dict = {s.key: s.value for s in settings}
        return Response(settings_dict)
    
    def post(self, request):
        """Bulk update settings"""
        for key, value in request.data.items():
            Setting.set_value(key, str(value))
        return Response({'message': 'Settings updated successfully'})


class SettingDetailView(APIView):
    """Get/Set individual setting"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, key):
        value = Setting.get_value(key)
        return Response({'key': key, 'value': value})
    
    def put(self, request, key):
        value = request.data.get('value', '')
        category = request.data.get('category', 'general')
        Setting.set_value(key, value, category)
        return Response({'key': key, 'value': value})


class DefaultSettingsView(APIView):
    """Initialize default settings"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        defaults = [
            # General Settings
            ('currency', '₹', 'general', 'Currency symbol'),
            ('decimal_places', '2', 'general', 'Decimal places for amounts'),
            ('low_stock_threshold', '15', 'general', 'Low stock alert threshold'),
            
            # Invoice Settings
            ('invoice_prefix', 'INV', 'invoice', 'Invoice number prefix'),
            ('default_tax_rate', '18', 'invoice', 'Default GST rate'),
            ('invoice_terms', 'Thank you for your business!', 'invoice', 'Default invoice terms'),
            
            # Notification Settings
            ('enable_stock_alert', 'true', 'notification', 'Enable low stock alerts'),
            ('enable_payment_reminder', 'true', 'notification', 'Enable payment reminders'),
            
            # Print Settings
            ('paper_size', 'A4', 'print', 'Default paper size'),
            ('print_logo', 'true', 'print', 'Print company logo on invoices'),
        ]
        
        for key, value, category, description in defaults:
            Setting.set_value(key, value, category, description)
        
        return Response({'message': 'Default settings initialized'})


class NotificationListView(APIView):
    """List and manage notifications"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get recent notifications"""
        from .models import Notification
        
        # Get last 20 notifications
        notifications = Notification.objects.all()[:20]
        unread_count = Notification.objects.filter(is_read=False).count()
        
        data = {
            'unread_count': unread_count,
            'notifications': [
                {
                    'id': n.id,
                    'type': n.type,
                    'title': n.title,
                    'message': n.message,
                    'link': n.link,
                    'amount': float(n.amount) if n.amount else None,
                    'is_read': n.is_read,
                    'created_at': n.created_at.isoformat(),
                }
                for n in notifications
            ]
        }
        return Response(data)
    
    def post(self, request):
        """Mark notifications as read"""
        from .models import Notification
        
        notification_ids = request.data.get('ids', [])
        mark_all = request.data.get('mark_all', False)
        
        if mark_all:
            Notification.objects.filter(is_read=False).update(is_read=True)
        elif notification_ids:
            Notification.objects.filter(id__in=notification_ids).update(is_read=True)
        
        return Response({'message': 'Notifications marked as read'})

