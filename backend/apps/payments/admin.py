from django.contrib import admin
from .models import Payment, PaymentOut


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['customer', 'amount', 'mode', 'payment_date', 'reference']
    list_filter = ['mode', 'payment_date']
    search_fields = ['customer__name', 'reference']


@admin.register(PaymentOut)
class PaymentOutAdmin(admin.ModelAdmin):
    list_display = ['supplier', 'amount', 'mode', 'payment_date']
    list_filter = ['mode', 'payment_date']
