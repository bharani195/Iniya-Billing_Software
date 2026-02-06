from django.db import models


class Customer(models.Model):
    """Customer Model for Billing Software"""
    
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=15, blank=True)
    mobile = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    gstin = models.CharField(max_length=15, blank=True, verbose_name='GSTIN')
    pan = models.CharField(max_length=10, blank=True, verbose_name='PAN')
    
    # Balance tracking
    opening_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    current_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Credit settings
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    credit_days = models.IntegerField(default=30)
    
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'customers'
        verbose_name = 'Customer'
        verbose_name_plural = 'Customers'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def update_balance(self, amount, is_debit=True):
        """Update customer balance after invoice or payment"""
        if is_debit:
            self.current_balance += amount
        else:
            self.current_balance -= amount
        self.save()
