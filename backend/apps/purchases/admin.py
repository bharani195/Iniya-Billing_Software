from django.contrib import admin
from .models import Purchase, PurchaseItem, Expense


class PurchaseItemInline(admin.TabularInline):
    model = PurchaseItem
    extra = 0


@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
    list_display = ['purchase_number', 'supplier', 'purchase_date', 'total', 'status']
    list_filter = ['status', 'purchase_date']
    inlines = [PurchaseItemInline]


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['category', 'description', 'amount', 'expense_date', 'payment_mode']
    list_filter = ['category', 'expense_date']
