from django.contrib import admin
from .models import MaterialType, PrintingType, ServiceRate, JobOrder, JobOrderService, JobStatusHistory


@admin.register(MaterialType)
class MaterialTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name']


@admin.register(PrintingType)
class PrintingTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name']


@admin.register(ServiceRate)
class ServiceRateAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'rate_type', 'rate', 'gst_rate', 'is_active']
    list_filter = ['category', 'rate_type', 'is_active']
    search_fields = ['name']


class JobOrderServiceInline(admin.TabularInline):
    model = JobOrderService
    extra = 1


class JobStatusHistoryInline(admin.TabularInline):
    model = JobStatusHistory
    extra = 0
    readonly_fields = ['from_status', 'to_status', 'changed_by', 'changed_at']
    can_delete = False


@admin.register(JobOrder)
class JobOrderAdmin(admin.ModelAdmin):
    list_display = ['job_number', 'customer', 'design_name', 'status', 'priority', 'total', 'expected_delivery']
    list_filter = ['status', 'priority', 'material_type', 'printing_type']
    search_fields = ['job_number', 'customer__name', 'design_name']
    date_hierarchy = 'job_date'
    inlines = [JobOrderServiceInline, JobStatusHistoryInline]
    readonly_fields = ['job_number', 'subtotal', 'tax_amount', 'total', 'balance']


@admin.register(JobOrderService)
class JobOrderServiceAdmin(admin.ModelAdmin):
    list_display = ['job_order', 'service_name', 'quantity', 'rate', 'amount']
    list_filter = ['service_rate']
    search_fields = ['service_name', 'job_order__job_number']


@admin.register(JobStatusHistory)
class JobStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ['job_order', 'from_status', 'to_status', 'changed_by', 'changed_at']
    list_filter = ['to_status']
    search_fields = ['job_order__job_number']
    readonly_fields = ['job_order', 'from_status', 'to_status', 'changed_by', 'changed_at']
