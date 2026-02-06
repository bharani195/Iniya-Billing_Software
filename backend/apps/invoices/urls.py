from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet
from .public_views import PublicInvoicePaymentView, PaymentSuccessView

router = DefaultRouter()
router.register('', InvoiceViewSet, basename='invoices')

urlpatterns = [
    # Public payment endpoints (no auth required)
    path('pay/<int:invoice_id>/<str:token>/', PublicInvoicePaymentView.as_view(), name='public-payment'),
    path('pay/<int:invoice_id>/<str:token>/success/', PaymentSuccessView.as_view(), name='payment-success'),
    # Standard invoice endpoints
    path('', include(router.urls)),
]

