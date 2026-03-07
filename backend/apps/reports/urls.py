from django.urls import path
from .views import (
    SalesReportView, PurchaseReportView, ProfitLossReportView,
    GSTReportView, StockReportView, DashboardDataView,
    StaffSalaryReportView, StaffSalaryExcelView
)

urlpatterns = [
    path('sales/', SalesReportView.as_view(), name='sales-report'),
    path('purchase/', PurchaseReportView.as_view(), name='purchase-report'),
    path('profit-loss/', ProfitLossReportView.as_view(), name='profit-loss-report'),
    path('gst/', GSTReportView.as_view(), name='gst-report'),
    path('stock/', StockReportView.as_view(), name='stock-report'),
    path('dashboard/', DashboardDataView.as_view(), name='dashboard-data'),
    path('staff-salary/', StaffSalaryReportView.as_view(), name='staff-salary-report'),
    path('staff-salary/excel/', StaffSalaryExcelView.as_view(), name='staff-salary-excel'),
]
