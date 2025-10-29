from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import User, Company
from .serializers import CompanySerializer
from rest_framework import viewsets


class CompanyViewSet(viewsets.ModelViewSet):
    """
    API view for companies.
    """
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated]
    
@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def api_info_view(request):
    """
    Public API information endpoint for testing browsable API.
    """
    return Response(
        {
            "message": "NetSentinel Control Plane API is running!",
            "version": "v1",
            "endpoints": {
                "authentication": "/api/v1/auth/",
                "user_stats": "/api/v1/stats/",
                "documentation": "/swagger/",
                "companies": "/api/v1/companies/",
            },
            "note": "Most endpoints require authentication. Use /api/v1/auth/users/ to register or /api/v1/auth/jwt/create/ to login.",
        }
    )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def user_stats_view(request):
    """
    API view for user statistics (admin only).
    """
    if not request.user.is_staff:
        return Response(
            {"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN
        )

    stats = {
        "total_users": User.objects.count(),
        "active_users": User.objects.filter(is_active=True).count(),
        "staff_users": User.objects.filter(is_staff=True).count(),
        "superusers": User.objects.filter(is_superuser=True).count(),
    }

    return Response(stats)
