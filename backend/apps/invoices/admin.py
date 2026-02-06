from django.contrib import admin
from .models import Invoice, InvoiceItem


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 0


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'customer', 'invoice_date', 'total', 'balance', 'status']
    list_filter = ['status', 'invoice_type', 'invoice_date']
    search_fields = ['invoice_number', 'customer__name']
    inlines = [InvoiceItemInline]
    ordering = ['-invoice_date', '-id']


@admin.register(InvoiceItem)
class InvoiceItemAdmin(admin.ModelAdmin):
    list_display = ['invoice', 'item_name', 'quantity', 'price', 'total']
    search_fields = ['item_name', 'invoice__invoice_number']
