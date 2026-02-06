from rest_framework import serializers
from .models import Company


class CompanySerializer(serializers.ModelSerializer):
    """Serializer for Company Profile"""
    logo_url = serializers.SerializerMethodField()
    signature_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Company
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
        return None
    
    def get_signature_url(self, obj):
        if obj.signature:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.signature.url)
        return None


class CompanyBasicSerializer(serializers.ModelSerializer):
    """Basic company info for invoice headers"""
    
    class Meta:
        model = Company
        fields = ['name', 'address', 'city', 'state', 'pincode', 
                  'phone', 'email', 'gstin', 'logo', 'signature']
