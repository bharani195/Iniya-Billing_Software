from django.db import models
from decimal import Decimal


class MaterialType(models.Model):
    """Master data for fabric/material types"""
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'material_types'
        verbose_name = 'Material Type'
        verbose_name_plural = 'Material Types'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class PrintingType(models.Model):
    """Master data for printing methods"""
    
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'printing_types'
        verbose_name = 'Printing Type'
        verbose_name_plural = 'Printing Types'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class ServiceRate(models.Model):
    """Configurable service rates for job orders"""
    
    RATE_TYPE_CHOICES = [
        ('fixed', 'Fixed Amount'),
        ('per_meter', 'Per Meter'),
        ('per_piece', 'Per Piece'),
        ('per_color', 'Per Color'),
        ('per_sqm', 'Per Square Meter'),
    ]
    
    SERVICE_CATEGORY_CHOICES = [
        ('design', 'Design Work'),
        ('printing', 'Printing'),
        ('finishing', 'Finishing'),
        ('other', 'Other'),
    ]
    
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=SERVICE_CATEGORY_CHOICES, default='other')
    rate_type = models.CharField(max_length=20, choices=RATE_TYPE_CHOICES, default='fixed')
    rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    min_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0, blank=True)
    max_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0, blank=True)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'service_rates'
        verbose_name = 'Service Rate'
        verbose_name_plural = 'Service Rates'
        ordering = ['category', 'name']
    
    def __str__(self):
        return f"{self.name} - ₹{self.rate}/{self.get_rate_type_display()}"


class JobOrder(models.Model):
    """Main Job Order / Work Receipt model"""
    
    STATUS_CHOICES = [
        ('received', 'Received'),
        ('designing', 'Designing'),
        ('color_separation', 'Color Separation'),
        ('printing', 'Printing'),
        ('drying', 'Drying'),
        ('finishing', 'Finishing'),
        ('ready', 'Ready for Delivery'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    
    PRIORITY_CHOICES = [
        ('normal', 'Normal'),
        ('urgent', 'Urgent'),
        ('express', 'Express'),
    ]
    
    UNIT_CHOICES = [
        ('MTR', 'Meters'),
        ('PCS', 'Pieces'),
        ('ROLL', 'Rolls'),
        ('KG', 'Kilograms'),
        ('SQM', 'Square Meters'),
    ]
    
    PAYMENT_TERMS_CHOICES = [
        (0, 'Due on Receipt'),
        (7, 'Net 7 Days'),
        (15, 'Net 15 Days'),
        (30, 'Net 30 Days'),
        (45, 'Net 45 Days'),
        (60, 'Net 60 Days'),
    ]
    
    # Job Details
    job_number = models.CharField(max_length=50, unique=True)
    job_date = models.DateField(auto_now_add=True)
    
    # Customer - either link to existing customer OR store name directly
    customer = models.ForeignKey(
        'customers.Customer', 
        on_delete=models.PROTECT, 
        related_name='job_orders',
        null=True,
        blank=True
    )
    customer_name = models.CharField(max_length=200, blank=True)  # Direct text entry
    
    # Material Details
    material_type = models.ForeignKey(
        MaterialType, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='job_orders'
    )
    material_type_name = models.CharField(max_length=100, blank=True)  # Direct text entry
    material_description = models.CharField(max_length=200, blank=True)
    material_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    material_unit = models.CharField(max_length=10, choices=UNIT_CHOICES, default='MTR')
    
    # Design Details
    design_name = models.CharField(max_length=200)
    design_file = models.FileField(upload_to='job_designs/', blank=True, null=True)
    design_notes = models.TextField(blank=True)
    design_provided_by_customer = models.BooleanField(default=False)
    design_image = models.ImageField(
        upload_to='job_designs/%Y/%m/', 
        blank=True, 
        null=True,
        help_text="Customer's digital design file (logo, artwork, pattern)"
    )
    
    # Printing Details
    printing_type = models.ForeignKey(
        PrintingType, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='job_orders'
    )
    printing_type_name = models.CharField(max_length=100, blank=True)  # Direct text entry
    num_colors = models.IntegerField(default=1)
    color_details = models.TextField(blank=True)
    
    # Screen/Stencil Details
    num_screens = models.IntegerField(default=0, help_text="Number of screens/stencils created")
    screen_charges = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="One-time screen setup cost")
    screen_details = models.TextField(blank=True, help_text="Screen specifications or notes")
    
    # Worker Assignment
    assigned_workers = models.ManyToManyField(
        'authentication.User',
        related_name='assigned_jobs',
        blank=True,
        limit_choices_to={'role': 'staff'},
        help_text="Staff members assigned to this job"
    )
    
    # Delivery
    expected_delivery = models.DateField(null=True, blank=True)
    actual_delivery = models.DateField(null=True, blank=True)
    
    # Status & Priority
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='received')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')
    
    # Amounts
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    advance_received = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Payment Terms
    payment_terms = models.IntegerField(
        choices=PAYMENT_TERMS_CHOICES, 
        default=15,
        help_text="Number of days until payment is due"
    )
    
    # Invoice Link
    invoice = models.ForeignKey(
        'invoices.Invoice', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='job_orders'
    )
    
    # Notes
    internal_notes = models.TextField(blank=True)
    customer_notes = models.TextField(blank=True)
    
    # Audit
    created_by = models.ForeignKey(
        'authentication.User', 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='created_job_orders'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'job_orders'
        verbose_name = 'Job Order'
        verbose_name_plural = 'Job Orders'
        ordering = ['-job_date', '-id']
    
    def __str__(self):
        name = self.customer_name or (self.customer.name if self.customer else 'Unknown')
        return f"{self.job_number} - {name}"
    
    def save(self, *args, **kwargs):
        # Calculate balance
        self.balance = self.total - self.advance_received
        super().save(*args, **kwargs)
    
    @property
    def due_date(self):
        """Calculate payment due date based on job_date and payment_terms"""
        from datetime import timedelta
        if self.job_date:
            return self.job_date + timedelta(days=self.payment_terms)
        return None
    
    def calculate_totals(self):
        """Recalculate totals from services"""
        services = self.services.all()
        self.subtotal = sum(service.amount for service in services)
        self.tax_amount = sum(service.tax_amount for service in services)
        self.total = self.subtotal + self.tax_amount
        self.balance = self.total - self.advance_received
        self.save()
    
    @classmethod
    def generate_job_number(cls):
        """Generate next job number"""
        last_job = cls.objects.order_by('-id').first()
        if last_job:
            try:
                last_num = int(last_job.job_number.replace('JOB-', ''))
                next_num = last_num + 1
            except ValueError:
                next_num = 1
        else:
            next_num = 1
        return f"JOB-{next_num:06d}"


class JobOrderService(models.Model):
    """Line items for services applied to a job order"""
    
    job_order = models.ForeignKey(
        JobOrder, 
        on_delete=models.CASCADE, 
        related_name='services'
    )
    service_rate = models.ForeignKey(
        ServiceRate, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    
    # Service Details
    service_name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Quantity and Rate
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit = models.CharField(max_length=20, default='unit')
    rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Tax
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Total
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    class Meta:
        db_table = 'job_order_services'
        verbose_name = 'Job Order Service'
        verbose_name_plural = 'Job Order Services'
    
    def __str__(self):
        return f"{self.service_name} x {self.quantity}"
    
    def save(self, *args, **kwargs):
        # Calculate amount
        base_amount = self.quantity * self.rate
        self.tax_amount = (base_amount * self.gst_rate) / Decimal(100)
        self.amount = base_amount
        super().save(*args, **kwargs)


class JobStatusHistory(models.Model):
    """Track status changes for audit trail"""
    
    job_order = models.ForeignKey(
        JobOrder, 
        on_delete=models.CASCADE, 
        related_name='status_history'
    )
    from_status = models.CharField(max_length=20, blank=True)
    to_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(
        'authentication.User', 
        on_delete=models.SET_NULL, 
        null=True
    )
    changed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'job_status_history'
        verbose_name = 'Job Status History'
        verbose_name_plural = 'Job Status History'
        ordering = ['-changed_at']
    
    def __str__(self):
        return f"{self.job_order.job_number}: {self.from_status} → {self.to_status}"
