from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Company
from .serializers import CompanySerializer


class CompanyProfileView(APIView):
    """Get and update company profile"""
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    
    def get(self, request):
        company = Company.get_default()
        serializer = CompanySerializer(company, context={'request': request})
        return Response(serializer.data)
    
    def put(self, request):
        company = Company.get_default()
        serializer = CompanySerializer(company, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    def patch(self, request):
        return self.put(request)


class UploadLogoView(APIView):
    """Upload company logo"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        company = Company.get_default()
        if 'logo' in request.FILES:
            company.logo = request.FILES['logo']
            company.save()
            serializer = CompanySerializer(company, context={'request': request})
            return Response(serializer.data)
        return Response({'error': 'No logo file provided'}, status=status.HTTP_400_BAD_REQUEST)


class UploadSignatureView(APIView):
    """Upload authorized signature"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        company = Company.get_default()
        if 'signature' in request.FILES:
            company.signature = request.FILES['signature']
            company.save()
            serializer = CompanySerializer(company, context={'request': request})
            return Response(serializer.data)
        return Response({'error': 'No signature file provided'}, status=status.HTTP_400_BAD_REQUEST)
