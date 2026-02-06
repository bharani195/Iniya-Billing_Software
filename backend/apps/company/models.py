from django.db import models


class Company(models.Model):
    """Company Profile for Billing Software"""
    
    name = models.CharField(max_length=200)
    logo = models.ImageField(upload_to='company/logos/', blank=True, null=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    mobile = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    gstin = models.CharField(max_length=15, blank=True, verbose_name='GSTIN')
    pan = models.CharField(max_length=10, blank=True, verbose_name='PAN')
    signature = models.ImageField(upload_to='company/signatures/', blank=True, null=True)
    
    # Bank Details
    bank_name = models.CharField(max_length=100, blank=True)
    account_number = models.CharField(max_length=20, blank=True)
    ifsc_code = models.CharField(max_length=11, blank=True)
    branch = models.CharField(max_length=100, blank=True)
    upi_id = models.CharField(max_length=50, blank=True)
    
    # Invoice Settings
    invoice_prefix = models.CharField(max_length=10, default='INV')
    invoice_start_number = models.IntegerField(default=1)
    terms_and_conditions = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'company'
        verbose_name = 'Company'
        verbose_name_plural = 'Companies'
    
    def __str__(self):
        return self.name
    
    @classmethod
    def get_default(cls):
        """Get or create default company"""
        company, created = cls.objects.get_or_create(
            pk=1,
            defaults={'name': 'Lakshmi Printing Works'}
        )
        return company
