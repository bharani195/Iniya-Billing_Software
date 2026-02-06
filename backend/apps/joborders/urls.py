from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
# Register specific routes FIRST (before the catch-all)
router.register(r'material-types', views.MaterialTypeViewSet, basename='material-types')
router.register(r'printing-types', views.PrintingTypeViewSet, basename='printing-types')
router.register(r'service-rates', views.ServiceRateViewSet, basename='service-rates')
router.register(r'services', views.JobOrderServiceViewSet, basename='job-services')
# Register main joborders route LAST
router.register(r'', views.JobOrderViewSet, basename='joborders')

urlpatterns = [
    path('', include(router.urls)),
]
