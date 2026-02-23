from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.http import HttpResponse
from decimal import Decimal
import calendar
from datetime import date

from .models import Staff, Attendance, PaySlip, WorkerAssignment
from .serializers import (
    StaffSerializer, StaffListSerializer,
    AttendanceSerializer, BulkAttendanceSerializer,
    PaySlipSerializer, WorkerAssignmentSerializer
)


class StaffViewSet(viewsets.ModelViewSet):
    """ViewSet for Staff CRUD"""
    queryset = Staff.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return StaffListSerializer
        return StaffSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        active = self.request.query_params.get('active')
        if active is not None:
            queryset = queryset.filter(is_active=active.lower() == 'true')
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        return queryset
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        total = Staff.objects.count()
        active = Staff.objects.filter(is_active=True).count()
        today = date.today()
        today_present = Attendance.objects.filter(
            date=today, status='present'
        ).count()
        today_half = Attendance.objects.filter(
            date=today, status='half_day'
        ).count()
        
        return Response({
            'total_staff': total,
            'active_staff': active,
            'today_present': today_present,
            'today_half_day': today_half,
        })
    
    @action(detail=False, methods=['get'])
    def dropdown(self, request):
        staff = Staff.objects.filter(is_active=True).values('id', 'name', 'role')
        return Response(list(staff))


class AttendanceViewSet(viewsets.ModelViewSet):
    """ViewSet for Attendance"""
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        staff_id = self.request.query_params.get('staff')
        if staff_id:
            queryset = queryset.filter(staff_id=staff_id)
        date_val = self.request.query_params.get('date')
        if date_val:
            queryset = queryset.filter(date=date_val)
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        if month and year:
            queryset = queryset.filter(date__month=month, date__year=year)
        return queryset
    
    @action(detail=False, methods=['post'])
    def bulk_mark(self, request):
        """Mark attendance for multiple staff at once"""
        att_date = request.data.get('date')
        records = request.data.get('records', [])
        
        if not att_date or not records:
            return Response({'error': 'date and records are required'}, status=400)
        
        created = 0
        updated = 0
        for record in records:
            staff_id = record.get('staff_id')
            status = record.get('status', 'present')
            overtime = record.get('overtime_hours', '0')
            notes = record.get('notes', '')
            
            obj, was_created = Attendance.objects.update_or_create(
                staff_id=staff_id,
                date=att_date,
                defaults={
                    'status': status,
                    'overtime_hours': Decimal(str(overtime or '0')),
                    'notes': notes,
                }
            )
            if was_created:
                created += 1
            else:
                updated += 1
        
        return Response({
            'message': f'Attendance saved: {created} created, {updated} updated',
            'created': created,
            'updated': updated,
        })
    
    @action(detail=False, methods=['get'])
    def monthly_summary(self, request):
        """Get monthly attendance summary for all staff"""
        month = int(request.query_params.get('month', date.today().month))
        year = int(request.query_params.get('year', date.today().year))
        
        staff_list = Staff.objects.filter(is_active=True)
        summary = []
        
        for s in staff_list:
            records = Attendance.objects.filter(
                staff=s, date__month=month, date__year=year
            )
            present = records.filter(status='present').count()
            half_day = records.filter(status='half_day').count()
            absent = records.filter(status='absent').count()
            leave = records.filter(status='leave').count()
            overtime = records.aggregate(total=Sum('overtime_hours'))['total'] or 0
            
            summary.append({
                'staff_id': s.id,
                'staff_name': s.name,
                'role': s.get_role_display(),
                'present': present,
                'half_day': half_day,
                'absent': absent,
                'leave': leave,
                'overtime_hours': float(overtime),
                'total_records': records.count(),
            })
        
        return Response({
            'month': month,
            'year': year,
            'month_name': calendar.month_name[month],
            'summary': summary,
        })


class PaySlipViewSet(viewsets.ModelViewSet):
    """ViewSet for Pay Slips"""
    queryset = PaySlip.objects.all()
    serializer_class = PaySlipSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        staff_id = self.request.query_params.get('staff')
        if staff_id:
            queryset = queryset.filter(staff_id=staff_id)
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')
        if month:
            queryset = queryset.filter(month=month)
        if year:
            queryset = queryset.filter(year=year)
        return queryset
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate pay slip for a staff member for a given month"""
        staff_id = request.data.get('staff_id')
        month = int(request.data.get('month', date.today().month))
        year = int(request.data.get('year', date.today().year))
        
        try:
            staff = Staff.objects.get(id=staff_id)
        except Staff.DoesNotExist:
            return Response({'error': 'Staff not found'}, status=404)
        
        # Check if already exists
        existing = PaySlip.objects.filter(staff=staff, month=month, year=year).first()
        if existing:
            return Response({'error': 'Pay slip already exists for this month', 'id': existing.id}, status=400)
        
        # Calculate from attendance
        records = Attendance.objects.filter(staff=staff, date__month=month, date__year=year)
        days_present = records.filter(status='present').count()
        half_days = records.filter(status='half_day').count()
        days_absent = records.filter(status='absent').count()
        leaves = records.filter(status='leave').count()
        overtime_hours = records.aggregate(total=Sum('overtime_hours'))['total'] or Decimal('0')
        
        # Total working days in month
        total_working_days = days_present + half_days + days_absent
        
        # Calculate salary
        if staff.salary_type == 'daily':
            effective_days = Decimal(str(days_present)) + (Decimal(str(half_days)) * Decimal('0.5'))
            gross_salary = effective_days * staff.daily_rate
            overtime_rate = staff.daily_rate / Decimal('8')  # per hour
            overtime_amount = overtime_hours * overtime_rate
        else:
            # Monthly: deduct for absent days
            days_in_month = calendar.monthrange(year, month)[1]
            per_day = staff.monthly_salary / Decimal(str(days_in_month))
            absent_deduction = Decimal(str(days_absent)) * per_day
            half_day_deduction = Decimal(str(half_days)) * per_day * Decimal('0.5')
            gross_salary = staff.monthly_salary - absent_deduction - half_day_deduction
            overtime_rate = per_day / Decimal('8')
            overtime_amount = overtime_hours * overtime_rate
        
        net_salary = gross_salary + overtime_amount
        
        payslip = PaySlip.objects.create(
            staff=staff,
            month=month,
            year=year,
            total_working_days=total_working_days,
            days_present=days_present,
            half_days=half_days,
            days_absent=days_absent,
            leaves=leaves,
            overtime_hours=overtime_hours,
            overtime_amount=round(overtime_amount, 2),
            gross_salary=round(gross_salary, 2),
            deductions=0,
            net_salary=round(net_salary, 2),
        )
        
        return Response(PaySlipSerializer(payslip).data, status=201)
    
    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        """Download pay slip as PDF"""
        payslip = self.get_object()
        
        from .utils.pay_slip_pdf import generate_pay_slip_pdf
        
        # Get company info
        from apps.settings.models import Setting
        company_name = Setting.get_value('company_name', 'Company Name')
        company_address = Setting.get_value('company_address', '')
        company_phone = Setting.get_value('company_phone', '')
        
        pdf_buffer = generate_pay_slip_pdf(payslip, company_name, company_address, company_phone)
        
        response = HttpResponse(pdf_buffer, content_type='application/pdf')
        filename = f"PaySlip_{payslip.staff.name}_{payslip.month}_{payslip.year}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark pay slip as paid"""
        payslip = self.get_object()
        payslip.payment_status = 'paid'
        payslip.paid_date = request.data.get('paid_date', date.today())
        payslip.payment_mode = request.data.get('payment_mode', 'cash')
        payslip.save()
        return Response(PaySlipSerializer(payslip).data)
    
    @action(detail=True, methods=['post'])
    def reset_paid(self, request, pk=None):
        """Reset pay slip back to pending"""
        payslip = self.get_object()
        payslip.payment_status = 'pending'
        payslip.paid_date = None
        payslip.payment_mode = ''
        payslip.save()
        return Response(PaySlipSerializer(payslip).data)
    
    @action(detail=True, methods=['delete'])
    def remove(self, request, pk=None):
        """Delete a pay slip so it can be regenerated"""
        payslip = self.get_object()
        payslip.delete()
        return Response(status=204)


class WorkerAssignmentViewSet(viewsets.ModelViewSet):
    """ViewSet for Worker Assignments on Job Orders"""
    queryset = WorkerAssignment.objects.all()
    serializer_class = WorkerAssignmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        job_id = self.request.query_params.get('job_order')
        if job_id:
            queryset = queryset.filter(job_order_id=job_id)
        staff_id = self.request.query_params.get('staff')
        if staff_id:
            queryset = queryset.filter(staff_id=staff_id)
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        return queryset
    
    @action(detail=False, methods=['post'])
    def bulk_assign(self, request):
        """Assign multiple workers to a job order at once"""
        job_order_id = request.data.get('job_order')
        assignments = request.data.get('assignments', [])
        
        if not job_order_id:
            return Response({'error': 'job_order is required'}, status=400)
        
        # Remove existing assignments for this job that are not in new list
        new_staff_ids = [a.get('staff') for a in assignments]
        WorkerAssignment.objects.filter(
            job_order_id=job_order_id
        ).exclude(staff_id__in=new_staff_ids).delete()
        
        results = []
        for assignment in assignments:
            staff_id = assignment.get('staff')
            obj, created = WorkerAssignment.objects.update_or_create(
                job_order_id=job_order_id,
                staff_id=staff_id,
                defaults={
                    'task_description': assignment.get('task_description', ''),
                    'estimated_hours': assignment.get('estimated_hours', 0),
                    'notes': assignment.get('notes', ''),
                }
            )
            results.append(WorkerAssignmentSerializer(obj).data)
        
        return Response({
            'message': f'{len(results)} worker(s) assigned',
            'assignments': results
        })
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update task status for a worker assignment"""
        assignment = self.get_object()
        new_status = request.data.get('status')
        if new_status not in ['pending', 'in_progress', 'completed']:
            return Response({'error': 'Invalid status'}, status=400)
        assignment.status = new_status
        if new_status == 'completed':
            from django.utils import timezone
            assignment.completed_at = timezone.now()
        assignment.save()
        return Response(WorkerAssignmentSerializer(assignment).data)

