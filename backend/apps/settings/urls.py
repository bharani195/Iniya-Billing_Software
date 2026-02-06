from django.urls import path
from .views import SettingListView, SettingDetailView, DefaultSettingsView, NotificationListView

urlpatterns = [
    path('', SettingListView.as_view(), name='settings-list'),
    path('defaults/', DefaultSettingsView.as_view(), name='settings-defaults'),
    path('notifications/', NotificationListView.as_view(), name='notifications'),
    path('<str:key>/', SettingDetailView.as_view(), name='settings-detail'),
]

