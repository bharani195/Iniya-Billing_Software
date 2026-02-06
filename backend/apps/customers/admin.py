from django.contrib import admin
from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'email', 'gstin', 'current_balance', 'is_active', 'created_at']
    list_filter = ['is_active', 'city', 'state']
    search_fields = ['name', 'phone', 'email', 'gstin']
    ordering = ['name']
