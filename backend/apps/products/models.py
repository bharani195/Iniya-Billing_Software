from django.db import models


class Category(models.Model):
    """Product Category"""
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'categories'
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Product(models.Model):
    """Product / Service Model"""
    
    UNIT_CHOICES = [
        ('PCS', 'Pieces'),
        ('NOS', 'Numbers'),
        ('KG', 'Kilograms'),
        ('GM', 'Grams'),
        ('MTR', 'Meters'),
        ('CM', 'Centimeters'),
        ('LTR', 'Liters'),
        ('ML', 'Milliliters'),
        ('BOX', 'Box'),
        ('PAC', 'Pack'),
        ('SET', 'Set'),
        ('SQM', 'Square Meters'),
        ('SQFT', 'Square Feet'),
    ]
    
    GST_RATE_CHOICES = [
        (0, '0%'),
        (0.25, '0.25%'),
        (3, '3%'),
        (5, '5%'),
        (12, '12%'),
        (18, '18%'),
        (28, '28%'),
    ]
    
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=50, blank=True, unique=True, null=True, verbose_name='SKU/Code')
    hsn_code = models.CharField(max_length=20, blank=True, verbose_name='HSN/SAC Code')
    description = models.TextField(blank=True)
    
    # Pricing
    sale_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    purchase_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    mrp = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='MRP')
    
    # Tax
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18, verbose_name='GST Rate %')
    is_inclusive = models.BooleanField(default=False, verbose_name='Price Inclusive of Tax')
    
    # Stock
    quantity = models.IntegerField(default=0)
    min_stock = models.IntegerField(default=10, verbose_name='Minimum Stock Level')
    max_stock = models.IntegerField(default=1000, verbose_name='Maximum Stock Level')
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES, default='PCS')
    
    # Additional
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    barcode = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    is_service = models.BooleanField(default=False, verbose_name='Is this a service?')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'products'
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.sku})" if self.sku else self.name
    
    @property
    def is_low_stock(self):
        """Check if stock is below minimum level"""
        return self.quantity <= self.min_stock
    
    @property
    def stock_value(self):
        """Calculate current stock value"""
        return self.quantity * self.purchase_price
    
    def update_stock(self, quantity_change, is_addition=True):
        """Update stock quantity"""
        if is_addition:
            self.quantity += quantity_change
        else:
            self.quantity -= quantity_change
        self.save()


class StockMovement(models.Model):
    """Track stock movements for audit trail"""
    
    MOVEMENT_TYPES = [
        ('IN', 'Stock In'),
        ('OUT', 'Stock Out'),
        ('ADJ', 'Adjustment'),
        ('RET', 'Return'),
    ]
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_movements')
    movement_type = models.CharField(max_length=3, choices=MOVEMENT_TYPES)
    quantity = models.IntegerField()
    previous_quantity = models.IntegerField()
    new_quantity = models.IntegerField()
    reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey('authentication.User', on_delete=models.SET_NULL, null=True)
    
    class Meta:
        db_table = 'stock_movements'
        verbose_name = 'Stock Movement'
        verbose_name_plural = 'Stock Movements'
        ordering = ['-created_at']
