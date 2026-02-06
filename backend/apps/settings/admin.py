from django.contrib import admin
from .models import Setting


@admin.register(Setting)
class SettingAdmin(admin.ModelAdmin):
    list_display = ['key', 'value', 'category']
    list_filter = ['category']
    search_fields = ['key', 'value']
