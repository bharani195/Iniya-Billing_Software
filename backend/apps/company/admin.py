from django.contrib import admin
from .models import Company


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'phone', 'email', 'gstin', 'updated_at']
    search_fields = ['name', 'email', 'gstin']
