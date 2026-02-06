from django.db import models
from decimal import Decimal


class Purchase(models.Model):
    """Purchase Bill Model"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('partial', 'Partially Paid'),
        ('paid', 'Paid'),
        ('cancelled', 'Cancelled'),
    ]
    
    purchase_number = models.CharField(max_length=50)
    bill_number = models.CharField(max_length=50, blank=True)
    purchase_date = models.DateField()
    due_date = models.DateField(null=True, blank=True)
    
    supplier = models.ForeignKey('suppliers.Supplier', on_delete=models.PROTECT, related_name='purchases')
    
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    created_by = models.ForeignKey('authentication.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'purchases'
        verbose_name = 'Purchase'
        verbose_name_plural = 'Purchases'
        ordering = ['-purchase_date', '-id']
    
    def __str__(self):
        return f"{self.purchase_number} - {self.supplier.name}"
    
    def save(self, *args, **kwargs):
        self.balance = self.total - self.paid
        if self.balance <= 0:
            self.status = 'paid'
        elif self.paid > 0:
            self.status = 'partial'
        super().save(*args, **kwargs)


class PurchaseItem(models.Model):
    """Purchase Line Item"""
    
    purchase = models.ForeignKey(Purchase, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, null=True, blank=True)
    
    item_name = models.CharField(max_length=200)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit = models.CharField(max_length=10, default='PCS')
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    class Meta:
        db_table = 'purchase_items'
    
    def save(self, *args, **kwargs):
        item_total = self.quantity * self.price
        self.tax_amount = (item_total * self.tax_rate) / Decimal(100)
        self.total = item_total + self.tax_amount
        super().save(*args, **kwargs)


class Expense(models.Model):
    """Business Expense Model"""
    
    CATEGORY_CHOICES = [
        ('rent', 'Rent'),
        ('salary', 'Salary'),
        ('utilities', 'Utilities'),
        ('transport', 'Transport'),
        ('maintenance', 'Maintenance'),
        ('office', 'Office Supplies'),
        ('marketing', 'Marketing'),
        ('other', 'Other'),
    ]
    
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='other')
    description = models.CharField(max_length=500)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    expense_date = models.DateField()
    payment_mode = models.CharField(max_length=20, default='cash')
    reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    
    created_by = models.ForeignKey('authentication.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'expenses'
        verbose_name = 'Expense'
        verbose_name_plural = 'Expenses'
        ordering = ['-expense_date', '-id']
    
    def __str__(self):
        return f"{self.category} - ₹{self.amount}"
