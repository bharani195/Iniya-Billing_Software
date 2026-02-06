from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView, LogoutView, ProfileView, PasswordChangeView, PasswordResetView,
    UserViewSet, DashboardStatsView
)

router = DefaultRouter()
router.register('users', UserViewSet, basename='users')

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('change-password/', PasswordChangeView.as_view(), name='change-password'),
    path('reset-password/', PasswordResetView.as_view(), name='reset-password'),
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('', include(router.urls)),
]

