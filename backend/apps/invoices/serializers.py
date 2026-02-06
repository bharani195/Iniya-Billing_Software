from rest_framework import serializers
from decimal import Decimal
from .models import Invoice, InvoiceItem
from apps.customers.serializers import CustomerListSerializer


class InvoiceItemSerializer(serializers.ModelSerializer):
    """Serializer for Invoice Items"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = InvoiceItem
        fields = '__all__'
        read_only_fields = ['id', 'discount_amount', 'tax_amount', 'total']


class InvoiceItemCreateSerializer(serializers.Serializer):
    """Serializer for creating invoice items"""
    product_id = serializers.IntegerField(required=False, allow_null=True)
    item_name = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True, default='')
    hsn_code = serializers.CharField(required=False, allow_blank=True, default='')
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit = serializers.CharField(max_length=10, default='PCS')
    price = serializers.DecimalField(max_digits=12, decimal_places=2)
    discount_type = serializers.ChoiceField(choices=['percent', 'amount'], default='amount')
    discount_value = serializers.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_rate = serializers.DecimalField(max_digits=5, decimal_places=2, default=0)


class InvoiceSerializer(serializers.ModelSerializer):
    """Full Invoice Serializer with items"""
    items = InvoiceItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    customer_gstin = serializers.CharField(source='customer.gstin', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ['id', 'invoice_number', 'subtotal', 'discount_amount', 
                           'cgst_amount', 'sgst_amount', 'igst_amount', 'tax_amount',
                           'total', 'balance', 'created_at', 'updated_at']


class InvoiceListSerializer(serializers.ModelSerializer):
    """Light serializer for invoice list"""
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    job_order_id = serializers.SerializerMethodField()
    
    class Meta:
        model = Invoice
        fields = ['id', 'invoice_number', 'invoice_type', 'invoice_date', 'due_date',
                  'customer', 'customer_name', 'customer_phone', 'customer_email', 'total', 'received', 'balance', 'status', 'job_order_id']
    
    def get_job_order_id(self, obj):
        """Get the first linked job order ID if exists"""
        job_order = obj.job_orders.first()
        return job_order.id if job_order else None


class InvoiceCreateSerializer(serializers.Serializer):
    """Serializer for creating invoices"""
    customer_id = serializers.IntegerField()
    invoice_type = serializers.ChoiceField(choices=['invoice', 'quotation', 'proforma', 'challan', 'credit_note'], default='invoice')
    invoice_date = serializers.DateField()
    due_date = serializers.DateField(required=False, allow_null=True)
    billing_address = serializers.CharField(required=False, allow_blank=True, default='')
    shipping_address = serializers.CharField(required=False, allow_blank=True, default='')
    discount_type = serializers.ChoiceField(choices=['percent', 'amount'], default='amount')
    discount_value = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_igst = serializers.BooleanField(default=False)
    notes = serializers.CharField(required=False, allow_blank=True, default='')
    terms = serializers.CharField(required=False, allow_blank=True, default='')
    received = serializers.DecimalField(max_digits=12, decimal_places=2, default=0)
    items = InvoiceItemCreateSerializer(many=True)
    
    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("At least one item is required")
        return value
    
    def validate_customer_id(self, value):
        from apps.customers.models import Customer
        if not Customer.objects.filter(id=value).exists():
            raise serializers.ValidationError("Customer not found")
        return value


class InvoicePDFSerializer(serializers.Serializer):
    """Serializer for invoice data needed for PDF"""
    invoice = serializers.SerializerMethodField()
    company = serializers.SerializerMethodField()
    
    def get_invoice(self, obj):
        return InvoiceSerializer(obj).data
    
    def get_company(self, obj):
        from apps.company.models import Company
        from apps.company.serializers import CompanySerializer
        company = Company.get_default()
        return CompanySerializer(company).data
