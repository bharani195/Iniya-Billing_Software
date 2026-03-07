from rest_framework import serializers
from .models import Staff, Attendance, PaySlip, WorkerAssignment, Holiday


class StaffSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    salary_type_display = serializers.CharField(source='get_salary_type_display', read_only=True)
    
    class Meta:
        model = Staff
        fields = '__all__'


class StaffListSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    salary_type_display = serializers.CharField(source='get_salary_type_display', read_only=True)
    
    class Meta:
        model = Staff
        fields = ['id', 'name', 'phone', 'role', 'role_display', 'salary_type', 
                  'salary_type_display', 'daily_rate', 'monthly_salary', 'is_active', 'joining_date']


class AttendanceSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Attendance
        fields = '__all__'


class BulkAttendanceSerializer(serializers.Serializer):
    """For marking attendance for multiple staff at once"""
    date = serializers.DateField()
    records = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )


class PaySlipSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.name', read_only=True)
    staff_role = serializers.CharField(source='staff.get_role_display', read_only=True)
    month_name = serializers.SerializerMethodField()
    
    class Meta:
        model = PaySlip
        fields = '__all__'
    
    def get_month_name(self, obj):
        import calendar
        return calendar.month_name[obj.month]


class WorkerAssignmentSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff.name', read_only=True)
    staff_role = serializers.CharField(source='staff.role', read_only=True)
    role_display = serializers.CharField(source='staff.get_role_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    job_number = serializers.CharField(source='job_order.job_number', read_only=True)
    
    class Meta:
        model = WorkerAssignment
        fields = '__all__'


class HolidaySerializer(serializers.ModelSerializer):
    holiday_type_display = serializers.CharField(source='get_holiday_type_display', read_only=True)
    
    class Meta:
        model = Holiday
        fields = '__all__'
