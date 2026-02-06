from django.contrib import admin
from .models import Supplier


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ['name', 'contact_person', 'phone', 'gstin', 'current_balance', 'is_active']
    list_filter = ['is_active', 'city', 'state']
    search_fields = ['name', 'phone', 'gstin']
