from django.db import models


class Payment(models.Model):
    """Payment Collection Model"""
    
    MODE_CHOICES = [
        ('cash', 'Cash'),
        ('upi', 'UPI'),
        ('bank', 'Bank Transfer'),
        ('card', 'Card'),
        ('cheque', 'Cheque'),
        ('online', 'Online'),
    ]
    
    invoice = models.ForeignKey('invoices.Invoice', on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    customer = models.ForeignKey('customers.Customer', on_delete=models.PROTECT, related_name='payments')
    
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='cash')
    payment_date = models.DateField()
    reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    
    # Cheque details
    cheque_number = models.CharField(max_length=20, blank=True)
    cheque_date = models.DateField(null=True, blank=True)
    bank_name = models.CharField(max_length=100, blank=True)
    
    created_by = models.ForeignKey('authentication.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'payments'
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        ordering = ['-payment_date', '-id']
    
    def __str__(self):
        return f"₹{self.amount} from {self.customer.name}"


class PaymentOut(models.Model):
    """Payment to Suppliers"""
    
    MODE_CHOICES = [
        ('cash', 'Cash'),
        ('upi', 'UPI'),
        ('bank', 'Bank Transfer'),
        ('cheque', 'Cheque'),
    ]
    
    supplier = models.ForeignKey('suppliers.Supplier', on_delete=models.PROTECT, related_name='payments')
    purchase = models.ForeignKey('purchases.Purchase', on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default='cash')
    payment_date = models.DateField()
    reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    
    created_by = models.ForeignKey('authentication.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'payments_out'
        verbose_name = 'Payment Out'
        verbose_name_plural = 'Payments Out'
        ordering = ['-payment_date', '-id']
