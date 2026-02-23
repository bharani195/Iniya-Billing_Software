from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta

from .models import MaterialType, PrintingType, ServiceRate, JobOrder, JobOrderService, JobStatusHistory
from .serializers import (
    MaterialTypeSerializer, PrintingTypeSerializer, ServiceRateSerializer,
    JobOrderListSerializer, JobOrderDetailSerializer, JobOrderCreateSerializer,
    JobOrderServiceSerializer, JobStatusHistorySerializer
)


class MaterialTypeViewSet(viewsets.ModelViewSet):
    """ViewSet for Material Types"""
    queryset = MaterialType.objects.all()
    serializer_class = MaterialTypeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = MaterialType.objects.all()
        if self.request.query_params.get('active_only') == 'true':
            queryset = queryset.filter(is_active=True)
        return queryset
    
    @action(detail=False, methods=['get'])
    def dropdown(self, request):
        """Get material types for dropdown"""
        materials = self.get_queryset().filter(is_active=True)
        data = [{'id': m.id, 'name': m.name} for m in materials]
        return Response(data)


class PrintingTypeViewSet(viewsets.ModelViewSet):
    """ViewSet for Printing Types"""
    queryset = PrintingType.objects.all()
    serializer_class = PrintingTypeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = PrintingType.objects.all()
        if self.request.query_params.get('active_only') == 'true':
            queryset = queryset.filter(is_active=True)
        return queryset
    
    @action(detail=False, methods=['get'])
    def dropdown(self, request):
        """Get printing types for dropdown"""
        types = self.get_queryset().filter(is_active=True)
        data = [{'id': t.id, 'name': t.name} for t in types]
        return Response(data)


class ServiceRateViewSet(viewsets.ModelViewSet):
    """ViewSet for Service Rates"""
    queryset = ServiceRate.objects.all()
    serializer_class = ServiceRateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = ServiceRate.objects.all()
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        if self.request.query_params.get('active_only') == 'true':
            queryset = queryset.filter(is_active=True)
        return queryset
    
    @action(detail=False, methods=['get'])
    def dropdown(self, request):
        """Get service rates for dropdown"""
        rates = self.get_queryset().filter(is_active=True)
        data = [{
            'id': r.id, 
            'name': r.name, 
            'rate': str(r.rate),
            'rate_type': r.rate_type,
            'gst_rate': str(r.gst_rate),
            'category': r.category
        } for r in rates]
        return Response(data)


class JobOrderViewSet(viewsets.ModelViewSet):
    """ViewSet for Job Orders"""
    queryset = JobOrder.objects.all()
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return JobOrderListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return JobOrderCreateSerializer
        return JobOrderDetailSerializer
    
    def get_queryset(self):
        queryset = JobOrder.objects.select_related(
            'customer', 'material_type', 'printing_type', 'created_by', 'invoice'
        )
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by priority
        priority = self.request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        
        # Filter by customer
        customer_id = self.request.query_params.get('customer')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        # Filter by date range
        from_date = self.request.query_params.get('from_date')
        to_date = self.request.query_params.get('to_date')
        if from_date:
            queryset = queryset.filter(job_date__gte=from_date)
        if to_date:
            queryset = queryset.filter(job_date__lte=to_date)
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(job_number__icontains=search) |
                Q(customer__name__icontains=search) |
                Q(design_name__icontains=search)
            )
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Override create to handle JSON services in FormData"""
        import json
        
        # Get mutable data - use dict() to ensure we can modify it
        data = dict(request.data)
        
        # Flatten single-item lists (FormData quirk)
        for key in list(data.keys()):
            if isinstance(data[key], list) and len(data[key]) == 1 and key != 'assigned_workers':
                data[key] = data[key][0]
        
        # Parse services if it's a JSON string
        if 'services' in data and isinstance(data.get('services'), str):
            try:
                data['services'] = json.loads(data['services'])
            except (json.JSONDecodeError, TypeError) as e:
                print(f"Error parsing services JSON: {e}")
        
        # Parse assigned_workers if it's a JSON string
        if 'assigned_workers' in data:
            workers = data['assigned_workers']
            if isinstance(workers, str):
                try:
                    if workers.startswith('['):
                        data['assigned_workers'] = json.loads(workers)
                    else:
                        data['assigned_workers'] = [int(workers)] if workers else []
                except (json.JSONDecodeError, ValueError) as e:
                    print(f"Error parsing assigned_workers: {e}")
                    data['assigned_workers'] = []
        
        # Preserve file from request.FILES
        if 'design_image' in request.FILES:
            data['design_image'] = request.FILES['design_image']
        elif 'design_image' in data and not hasattr(data.get('design_image'), 'read'):
            # Remove if it's not a valid file object
            del data['design_image']
        
        # Create a new request with modified data
        request._full_data = data
        
        return super().create(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        """Auto-transition to 'finishing' if workers are assigned at creation"""
        instance = serializer.save(created_by=self.request.user)
        if instance.assigned_workers.exists() and instance.status == 'received':
            instance.status = 'finishing'
            instance.save(update_fields=['status'])
            JobStatusHistory.objects.create(
                job_order=instance,
                from_status='received',
                to_status='finishing',
                changed_by=self.request.user,
                notes='Auto: workers assigned'
            )
    
    def perform_update(self, serializer):
        """Auto-transition to 'finishing' if workers are newly assigned during edit"""
        instance = serializer.save()
        if instance.assigned_workers.exists() and instance.status == 'received':
            instance.status = 'finishing'
            instance.save(update_fields=['status'])
            JobStatusHistory.objects.create(
                job_order=instance,
                from_status='received',
                to_status='finishing',
                changed_by=self.request.user,
                notes='Auto: workers assigned'
            )
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update job order status"""
        job_order = self.get_object()
        new_status = request.data.get('status')
        notes = request.data.get('notes', '')
        
        if not new_status:
            return Response(
                {'error': 'Status is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        valid_statuses = [s[0] for s in JobOrder.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Valid options: {valid_statuses}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = job_order.status
        job_order.status = new_status
        
        # Update delivery date if delivered
        if new_status == 'delivered' and not job_order.actual_delivery:
            job_order.actual_delivery = timezone.now().date()
        
        job_order.save()
        
        # Create status history
        JobStatusHistory.objects.create(
            job_order=job_order,
            from_status=old_status,
            to_status=new_status,
            changed_by=request.user,
            notes=notes
        )
        
        serializer = JobOrderDetailSerializer(job_order)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_service(self, request, pk=None):
        """Add a service to job order"""
        job_order = self.get_object()
        serializer = JobOrderServiceSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(job_order=job_order)
            job_order.calculate_totals()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def convert_to_invoice(self, request, pk=None):
        """Convert job order to invoice"""
        from apps.invoices.models import Invoice, InvoiceItem
        from apps.customers.models import Customer
        
        job_order = self.get_object()
        
        if job_order.invoice:
            return Response(
                {'error': 'Job order already has an invoice', 'invoice_id': job_order.invoice.id},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get or create customer from job order
            customer = job_order.customer
            if not customer and job_order.customer_name:
                # Create customer from customer_name
                customer, created = Customer.objects.get_or_create(
                    name=job_order.customer_name,
                    defaults={
                        'mobile': '',
                        'address': '',
                    }
                )
                # Link customer to job order
                job_order.customer = customer
                job_order.save(update_fields=['customer'])
            
            if not customer:
                return Response(
                    {'error': 'Job order must have a customer name'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create invoice
            invoice = Invoice.objects.create(
                invoice_number=Invoice.generate_invoice_number(),
                invoice_type='invoice',
                invoice_date=timezone.now().date(),
                customer=customer,
                billing_address=customer.address or '',
                created_by=request.user,
                notes=f"Generated from Job Order: {job_order.job_number}"
            )
            
            # Create invoice items from job services
            for service in job_order.services.all():
                InvoiceItem.objects.create(
                    invoice=invoice,
                    item_name=service.service_name,
                    description=service.description,
                    quantity=service.quantity,
                    unit=service.unit,
                    price=service.rate,
                    tax_rate=service.gst_rate,
                )
            
            # Calculate invoice totals
            invoice.calculate_totals()
            
            # Link invoice to job order and auto-mark as delivered
            job_order.invoice = invoice
            old_status = job_order.status
            job_order.status = 'delivered'
            if not job_order.actual_delivery:
                job_order.actual_delivery = timezone.now().date()
            job_order.save()
            
            # Record status change
            if old_status != 'delivered':
                JobStatusHistory.objects.create(
                    job_order=job_order,
                    from_status=old_status,
                    to_status='delivered',
                    changed_by=request.user,
                    notes=f'Auto: invoice {invoice.invoice_number} created'
                )
            
            return Response({
                'message': 'Invoice created successfully',
                'invoice_id': invoice.id,
                'invoice_number': invoice.invoice_number
            })
        except Exception as e:
            return Response(
                {'error': f'Failed to create invoice: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def receive_advance(self, request, pk=None):
        """Record advance payment"""
        job_order = self.get_object()
        amount = request.data.get('amount')
        
        if not amount:
            return Response(
                {'error': 'Amount is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            amount = float(amount)
        except ValueError:
            return Response(
                {'error': 'Invalid amount'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        job_order.advance_received += amount
        job_order.save()
        
        serializer = JobOrderDetailSerializer(job_order)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get job order statistics"""
        today = timezone.now().date()
        
        total = JobOrder.objects.count()
        in_progress = JobOrder.objects.filter(
            status__in=['received', 'finishing']
        ).count()
        ready = JobOrder.objects.filter(status='ready').count()
        overdue = JobOrder.objects.filter(
            expected_delivery__lt=today,
            status__in=['received', 'finishing']
        ).count()
        delivered_today = JobOrder.objects.filter(
            actual_delivery=today
        ).count()
        
        # Revenue stats
        this_month = JobOrder.objects.filter(
            job_date__year=today.year,
            job_date__month=today.month
        ).aggregate(
            total_value=Sum('total'),
            total_jobs=Count('id')
        )
        
        return Response({
            'total': total,
            'in_progress': in_progress,
            'ready': ready,
            'overdue': overdue,
            'delivered_today': delivered_today,
            'this_month_value': this_month['total_value'] or 0,
            'this_month_jobs': this_month['total_jobs'] or 0,
        })
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent job orders"""
        limit = int(request.query_params.get('limit', 10))
        jobs = self.get_queryset().order_by('-created_at')[:limit]
        serializer = JobOrderListSerializer(jobs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def next_number(self, request):
        """Get next job order number"""
        return Response({'job_number': JobOrder.generate_job_number()})
    
    @action(detail=True, methods=['get'])
    def generate_bill(self, request, pk=None):
        """Generate and download PDF bill for job order"""
        from django.http import HttpResponse
        from .utils.pdf_generator import generate_job_order_bill
        
        job_order = self.get_object()
        
        # Generate PDF with error handling
        try:
            pdf_buffer = generate_job_order_bill(job_order)
        except Exception as e:
            import traceback
            print("ERROR IN PDF GENERATION:")
            traceback.print_exc()
            return Response(
                {'error': f'PDF Generation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Create response
        response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Bill_{job_order.job_number}.pdf"'
        
        return response


class JobOrderServiceViewSet(viewsets.ModelViewSet):
    """ViewSet for Job Order Services"""
    queryset = JobOrderService.objects.all()
    serializer_class = JobOrderServiceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = JobOrderService.objects.all()
        job_order_id = self.request.query_params.get('job_order')
        if job_order_id:
            queryset = queryset.filter(job_order_id=job_order_id)
        return queryset
    
    def perform_create(self, serializer):
        instance = serializer.save()
        instance.job_order.calculate_totals()
    
    def perform_update(self, serializer):
        instance = serializer.save()
        instance.job_order.calculate_totals()
    
    def perform_destroy(self, instance):
        job_order = instance.job_order
        instance.delete()
        job_order.calculate_totals()
