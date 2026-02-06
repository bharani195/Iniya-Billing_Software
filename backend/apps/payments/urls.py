from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, PaymentOutViewSet

router = DefaultRouter()
router.register('out', PaymentOutViewSet, basename='payments-out')
router.register('', PaymentViewSet, basename='payments')

urlpatterns = [
    path('', include(router.urls)),
]
