from django.urls import path
from .views import CompanyProfileView, UploadLogoView, UploadSignatureView

urlpatterns = [
    path('profile/', CompanyProfileView.as_view(), name='company-profile'),
    path('upload-logo/', UploadLogoView.as_view(), name='upload-logo'),
    path('upload-signature/', UploadSignatureView.as_view(), name='upload-signature'),
]
