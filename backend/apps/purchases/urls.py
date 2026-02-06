from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PurchaseViewSet, ExpenseViewSet

router = DefaultRouter()
router.register('expenses', ExpenseViewSet, basename='expenses')
router.register('', PurchaseViewSet, basename='purchases')

urlpatterns = [
    path('', include(router.urls)),
]
