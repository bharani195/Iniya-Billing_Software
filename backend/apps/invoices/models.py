from django.db import models
from decimal import Decimal
import uuid


class Invoice(models.Model):
    """Main Invoice Model"""
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('partial', 'Partially Paid'),
        ('paid', 'Paid'),
        ('cancelled', 'Cancelled'),
    ]
    
    INVOICE_TYPES = [
        ('invoice', 'Tax Invoice'),
        ('quotation', 'Quotation'),
        ('proforma', 'Proforma Invoice'),
        ('challan', 'Delivery Challan'),
        ('credit_note', 'Credit Note'),
    ]
    
    # Invoice Details
    invoice_number = models.CharField(max_length=50, unique=True)
    invoice_type = models.CharField(max_length=20, choices=INVOICE_TYPES, default='invoice')
    invoice_date = models.DateField()
    due_date = models.DateField(null=True, blank=True)
    
    # Customer
    customer = models.ForeignKey('customers.Customer', on_delete=models.PROTECT, related_name='invoices')
    billing_address = models.TextField(blank=True)
    shipping_address = models.TextField(blank=True)
    
    # User who created
    created_by = models.ForeignKey('authentication.User', on_delete=models.SET_NULL, null=True, related_name='invoices')
    
    # Amounts
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_type = models.CharField(max_length=10, choices=[('percent', '%'), ('amount', '₹')], default='amount')
    discount_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Tax Details
    cgst_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    sgst_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    igst_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Totals
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    received = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Additional
    notes = models.TextField(blank=True)
    terms = models.TextField(blank=True)
    is_igst = models.BooleanField(default=False, verbose_name='Apply IGST')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Payment Link Token (for secure customer payment links)
    payment_token = models.CharField(max_length=64, unique=True, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'invoices'
        verbose_name = 'Invoice'
        verbose_name_plural = 'Invoices'
        ordering = ['-invoice_date', '-id']
    
    def __str__(self):
        return f"{self.invoice_number} - {self.customer.name}"
    
    def save(self, *args, **kwargs):
        # Calculate balance
        self.balance = self.total - self.received
        
        # Update status based on payments
        if self.balance <= 0:
            self.status = 'paid'
        elif self.received > 0:
            self.status = 'partial'
        
        super().save(*args, **kwargs)
    
    def calculate_totals(self):
        """Recalculate all totals from items"""
        items = self.items.all()
        
        self.subtotal = sum(item.total for item in items)
        
        # Calculate discount
        if self.discount_type == 'percent':
            self.discount_amount = (self.subtotal * self.discount_value) / Decimal(100)
        else:
            self.discount_amount = self.discount_value
        
        subtotal_after_discount = self.subtotal - self.discount_amount
        
        # Calculate taxes
        if self.is_igst:
            self.igst_amount = sum((item.tax_amount or 0) for item in items)
            self.cgst_amount = 0
            self.sgst_amount = 0
        else:
            total_tax = sum((item.tax_amount or 0) for item in items)
            self.cgst_amount = total_tax / 2
            self.sgst_amount = total_tax / 2
            self.igst_amount = 0
        
        self.tax_amount = self.cgst_amount + self.sgst_amount + self.igst_amount
        self.total = subtotal_after_discount + self.tax_amount
        self.balance = self.total - self.received
        
        self.save()
    
    @classmethod
    def generate_invoice_number(cls):
        """Generate next invoice number"""
        from apps.company.models import Company
        company = Company.get_default()
        prefix = company.invoice_prefix
        
        last_invoice = cls.objects.filter(
            invoice_number__startswith=prefix
        ).order_by('-id').first()
        
        if last_invoice:
            try:
                last_num = int(last_invoice.invoice_number.replace(prefix, ''))
                next_num = last_num + 1
            except ValueError:
                next_num = company.invoice_start_number
        else:
            next_num = company.invoice_start_number
        
        return f"{prefix}{next_num:06d}"
    
    def generate_payment_token(self):
        """Generate unique payment token for secure payment link"""
        if not self.payment_token:
            self.payment_token = uuid.uuid4().hex
            self.save(update_fields=['payment_token'])
        return self.payment_token
    
    def get_payment_url(self, base_url='http://localhost:5173'):
        """Get full payment URL for customer"""
        token = self.generate_payment_token()
        return f"{base_url}/pay/{self.id}/{token}"


class InvoiceItem(models.Model):
    """Invoice Line Item"""
    
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, null=True, blank=True, related_name='invoice_items')
    
    # Item Details
    item_name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    hsn_code = models.CharField(max_length=20, blank=True)
    
    # Quantity and Price
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit = models.CharField(max_length=10, default='PCS')
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Discount
    discount_type = models.CharField(max_length=10, choices=[('percent', '%'), ('amount', '₹')], default='amount')
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Tax
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Total
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    class Meta:
        db_table = 'invoice_items'
        verbose_name = 'Invoice Item'
        verbose_name_plural = 'Invoice Items'
    
    def __str__(self):
        return f"{self.item_name} x {self.quantity}"
    
    def save(self, *args, **kwargs):
        # Calculate discount amount
        item_total = self.quantity * self.price
        if self.discount_type == 'percent':
            self.discount_amount = (item_total * self.discount_value) / Decimal(100)
        else:
            self.discount_amount = self.discount_value
        
        # Calculate tax
        taxable_amount = item_total - self.discount_amount
        self.tax_amount = (taxable_amount * self.tax_rate) / Decimal(100)
        
        # Calculate total
        self.total = taxable_amount + self.tax_amount
        
        super().save(*args, **kwargs)
