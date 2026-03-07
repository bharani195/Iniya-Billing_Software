from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StaffViewSet, AttendanceViewSet, PaySlipViewSet, WorkerAssignmentViewSet, HolidayViewSet

router = DefaultRouter()
router.register('members', StaffViewSet)
router.register('attendance', AttendanceViewSet)
router.register('payslips', PaySlipViewSet)
router.register('assignments', WorkerAssignmentViewSet)
router.register('holidays', HolidayViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
