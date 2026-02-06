from django.db import models


class Setting(models.Model):
    """Key-Value Settings Store"""
    
    CATEGORY_CHOICES = [
        ('general', 'General'),
        ('invoice', 'Invoice'),
        ('tax', 'Tax'),
        ('print', 'Print'),
        ('notification', 'Notification'),
    ]
    
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='general')
    description = models.CharField(max_length=255, blank=True)
    
    class Meta:
        db_table = 'settings'
        verbose_name = 'Setting'
        verbose_name_plural = 'Settings'
    
    def __str__(self):
        return f"{self.key}: {self.value}"
    
    @classmethod
    def get_value(cls, key, default=None):
        try:
            return cls.objects.get(key=key).value
        except cls.DoesNotExist:
            return default
    
    @classmethod
    def set_value(cls, key, value, category='general', description=''):
        setting, created = cls.objects.update_or_create(
            key=key,
            defaults={
                'value': value,
                'category': category,
                'description': description
            }
        )
        return setting


class Notification(models.Model):
    """Admin Notifications for important events like payments"""
    
    TYPE_CHOICES = [
        ('payment', 'Payment Received'),
        ('order', 'New Order'),
        ('alert', 'Alert'),
        ('info', 'Information'),
    ]
    
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='info')
    title = models.CharField(max_length=200)
    message = models.TextField()
    link = models.CharField(max_length=255, blank=True)  # URL to navigate to
    
    # Related data
    invoice_id = models.IntegerField(null=True, blank=True)
    payment_id = models.IntegerField(null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Status
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.type}: {self.title}"
    
    @classmethod
    def create_payment_notification(cls, invoice, payment, amount):
        """Create notification for successful payment"""
        return cls.objects.create(
            type='payment',
            title=f'Payment Received - {invoice.invoice_number}',
            message=f'₹{amount:,.2f} received from {invoice.customer.name} via Stripe',
            link=f'/payments',
            invoice_id=invoice.id,
            payment_id=payment.id if payment else None,
            amount=amount
        )

