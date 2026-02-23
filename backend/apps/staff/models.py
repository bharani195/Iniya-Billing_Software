from django.db import models
from decimal import Decimal


class Staff(models.Model):
    """Staff Member Model"""
    
    ROLE_CHOICES = [
        ('printer', 'Printer'),
        ('helper', 'Helper'),
        ('designer', 'Designer'),
        ('driver', 'Driver'),
        ('binder', 'Binder'),
        ('operator', 'Machine Operator'),
        ('manager', 'Manager'),
        ('other', 'Other'),
    ]
    
    SALARY_TYPE_CHOICES = [
        ('daily', 'Daily Wage'),
        ('monthly', 'Monthly Salary'),
    ]
    
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=15, blank=True)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='helper')
    
    salary_type = models.CharField(max_length=10, choices=SALARY_TYPE_CHOICES, default='daily')
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    monthly_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    joining_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    # Optional details for pay slip
    aadhar_number = models.CharField(max_length=20, blank=True)
    bank_account = models.CharField(max_length=30, blank=True)
    bank_name = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'staff'
        verbose_name = 'Staff'
        verbose_name_plural = 'Staff'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.get_role_display()})"


class Attendance(models.Model):
    """Daily Attendance Record"""
    
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('half_day', 'Half Day'),
        ('leave', 'Leave'),
    ]
    
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='attendance')
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='present')
    overtime_hours = models.DecimalField(max_digits=4, decimal_places=1, default=0)
    notes = models.CharField(max_length=200, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'staff_attendance'
        verbose_name = 'Attendance'
        verbose_name_plural = 'Attendance Records'
        ordering = ['-date', 'staff__name']
        unique_together = ['staff', 'date']
    
    def __str__(self):
        return f"{self.staff.name} - {self.date} - {self.status}"


class PaySlip(models.Model):
    """Monthly Pay Slip"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
    ]
    
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='payslips')
    month = models.IntegerField()  # 1-12
    year = models.IntegerField()
    
    total_working_days = models.IntegerField(default=0)
    days_present = models.IntegerField(default=0)
    half_days = models.IntegerField(default=0)
    days_absent = models.IntegerField(default=0)
    leaves = models.IntegerField(default=0)
    
    overtime_hours = models.DecimalField(max_digits=6, decimal_places=1, default=0)
    overtime_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    gross_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    payment_status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    paid_date = models.DateField(null=True, blank=True)
    payment_mode = models.CharField(max_length=20, blank=True)
    
    notes = models.TextField(blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'staff_payslips'
        verbose_name = 'Pay Slip'
        verbose_name_plural = 'Pay Slips'
        ordering = ['-year', '-month', 'staff__name']
        unique_together = ['staff', 'month', 'year']
    
    def __str__(self):
        return f"{self.staff.name} - {self.month}/{self.year} - ₹{self.net_salary}"


class WorkerAssignment(models.Model):
    """Track worker assignments to job orders with task details"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]
    
    job_order = models.ForeignKey(
        'joborders.JobOrder',
        on_delete=models.CASCADE,
        related_name='worker_assignments'
    )
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='job_assignments')
    task_description = models.CharField(max_length=300, blank=True)
    estimated_hours = models.DecimalField(max_digits=6, decimal_places=1, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    assigned_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    notes = models.CharField(max_length=300, blank=True)
    
    class Meta:
        db_table = 'worker_assignments'
        verbose_name = 'Worker Assignment'
        verbose_name_plural = 'Worker Assignments'
        unique_together = ['job_order', 'staff']
        ordering = ['assigned_at']
    
    def __str__(self):
        return f"{self.staff.name} → {self.job_order.job_number}"
