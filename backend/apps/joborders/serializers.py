from rest_framework import serializers
from .models import MaterialType, PrintingType, ServiceRate, JobOrder, JobOrderService, JobStatusHistory


class MaterialTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterialType
        fields = '__all__'


class PrintingTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrintingType
        fields = '__all__'


class ServiceRateSerializer(serializers.ModelSerializer):
    rate_type_display = serializers.CharField(source='get_rate_type_display', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = ServiceRate
        fields = '__all__'


class JobOrderServiceSerializer(serializers.ModelSerializer):
    service_rate_name = serializers.CharField(source='service_rate.name', read_only=True)
    
    class Meta:
        model = JobOrderService
        fields = '__all__'
        read_only_fields = ['tax_amount', 'amount']


class ServiceCreateSerializer(serializers.Serializer):
    """Simplified serializer for creating services within job orders"""
    service_rate = serializers.PrimaryKeyRelatedField(queryset=ServiceRate.objects.all(), required=False, allow_null=True)
    service_name = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, allow_blank=True, default='')
    quantity = serializers.DecimalField(max_digits=10, decimal_places=2)
    unit = serializers.CharField(max_length=20, default='unit')
    rate = serializers.DecimalField(max_digits=10, decimal_places=2)
    gst_rate = serializers.DecimalField(max_digits=5, decimal_places=2, default=18)


class JobStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.username', read_only=True)
    from_status_display = serializers.SerializerMethodField()
    to_status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = JobStatusHistory
        fields = '__all__'
    
    def get_from_status_display(self, obj):
        status_dict = dict(JobOrder.STATUS_CHOICES)
        return status_dict.get(obj.from_status, obj.from_status)
    
    def get_to_status_display(self, obj):
        status_dict = dict(JobOrder.STATUS_CHOICES)
        return status_dict.get(obj.to_status, obj.to_status)


class JobOrderListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    display_customer_name = serializers.SerializerMethodField()
    material_type_name = serializers.CharField(source='material_type.name', read_only=True)
    printing_type_name = serializers.CharField(source='printing_type.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    is_overdue = serializers.SerializerMethodField()
    assigned_worker_names = serializers.SerializerMethodField()
    
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    
    class Meta:
        model = JobOrder
        fields = [
            'id', 'job_number', 'job_date', 'customer', 'customer_name', 'display_customer_name',
            'design_name', 'material_type', 'material_type_name',
            'material_quantity', 'material_unit', 'printing_type', 
            'printing_type_name', 'num_colors', 'num_screens', 'screen_charges',
            'expected_delivery', 'status', 'status_display', 'priority', 'priority_display',
            'total', 'balance', 'is_overdue', 'assigned_workers', 'assigned_worker_names',
            'invoice', 'invoice_number'
        ]
    
    def get_display_customer_name(self, obj):
        return obj.customer_name or (obj.customer.name if obj.customer else 'Unknown')
    
    def get_is_overdue(self, obj):
        from django.utils import timezone
        if obj.expected_delivery and obj.status not in ['delivered', 'cancelled']:
            return obj.expected_delivery < timezone.now().date()
        return False
    
    def get_assigned_worker_names(self, obj):
        return [w.full_name for w in obj.assigned_workers.all()]


class JobOrderDetailSerializer(serializers.ModelSerializer):
    """Full serializer for detail view"""
    display_customer_name = serializers.SerializerMethodField()
    customer_phone = serializers.SerializerMethodField()
    material_type_name = serializers.CharField(source='material_type.name', read_only=True)
    printing_type_name = serializers.CharField(source='printing_type.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    services = JobOrderServiceSerializer(many=True, read_only=True)
    status_history = JobStatusHistorySerializer(many=True, read_only=True)
    is_overdue = serializers.SerializerMethodField()
    assigned_worker_names = serializers.SerializerMethodField()
    design_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = JobOrder
        fields = '__all__'
    
    def get_display_customer_name(self, obj):
        return obj.customer_name or (obj.customer.name if obj.customer else 'Unknown')
    
    def get_customer_phone(self, obj):
        return obj.customer.mobile if obj.customer else ''
    
    def get_is_overdue(self, obj):
        from django.utils import timezone
        if obj.expected_delivery and obj.status not in ['delivered', 'cancelled']:
            return obj.expected_delivery < timezone.now().date()
        return False
    
    def get_assigned_worker_names(self, obj):
        return [{'id': w.id, 'name': w.full_name} for w in obj.assigned_workers.all()]
    
    def get_design_image_url(self, obj):
        if obj.design_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.design_image.url)
        return None


class JobOrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating job orders"""
    services = ServiceCreateSerializer(many=True, required=False)
    
    class Meta:
        model = JobOrder
        fields = '__all__'
        read_only_fields = ['job_number', 'subtotal', 'tax_amount', 'total', 'balance', 'created_by']
        extra_kwargs = {
            'design_image': {'required': False},
        }
    
    def create(self, validated_data):
        services_data = validated_data.pop('services', [])
        assigned_workers_data = validated_data.pop('assigned_workers', [])
        
        # Generate job number
        validated_data['job_number'] = JobOrder.generate_job_number()
        
        # Set created_by
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['created_by'] = request.user
        
        job_order = JobOrder.objects.create(**validated_data)
        
        # Assign workers
        if assigned_workers_data:
            job_order.assigned_workers.set(assigned_workers_data)
        
        # Create services
        for service_data in services_data:
            JobOrderService.objects.create(job_order=job_order, **service_data)
        
        # Calculate totals
        job_order.calculate_totals()
        
        # Create initial status history
        JobStatusHistory.objects.create(
            job_order=job_order,
            from_status='',
            to_status='received',
            changed_by=validated_data.get('created_by'),
            notes='Job order created'
        )
        
        return job_order
    
    def update(self, instance, validated_data):
        services_data = validated_data.pop('services', None)
        assigned_workers_data = validated_data.pop('assigned_workers', None)
        
        # Update main fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update assigned workers if provided
        if assigned_workers_data is not None:
            instance.assigned_workers.set(assigned_workers_data)
        
        # Update services if provided
        if services_data is not None:
            instance.services.all().delete()
            for service_data in services_data:
                JobOrderService.objects.create(job_order=instance, **service_data)
            instance.calculate_totals()
        
        return instance
