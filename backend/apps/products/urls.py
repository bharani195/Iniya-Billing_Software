from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ProductViewSet, StockMovementViewSet

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='categories')
router.register('stock-movements', StockMovementViewSet, basename='stock-movements')
router.register('', ProductViewSet, basename='products')

urlpatterns = [
    path('', include(router.urls)),
]
