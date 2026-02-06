"""
URL configuration for Lakshmi Printing Works Billing Software
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Routes
    path('api/auth/', include('apps.authentication.urls')),
    path('api/company/', include('apps.company.urls')),
    path('api/customers/', include('apps.customers.urls')),
    path('api/suppliers/', include('apps.suppliers.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/invoices/', include('apps.invoices.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/purchases/', include('apps.purchases.urls')),
    path('api/reports/', include('apps.reports.urls')),
    path('api/settings/', include('apps.settings.urls')),
    path('api/joborders/', include('apps.joborders.urls')),
    
    # Token refresh
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
