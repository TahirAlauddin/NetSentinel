from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.request import Request
from rest_framework.response import Response
from django.conf import settings
from infrastructure.models import CompanyProfile
from infrastructure.serializers import CompanyProfileSerializer


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def api_info_view(request: Request) -> Response:
    """
    Public API information endpoint for testing browsable API.
    """
    # Always keep updated on every release, change endpoints from v1 to v2, v3, etc.
    return Response(
        {
            "message": "NetSentinel API is running!",
            "version": "v1",
            "endpoints": {
                "authentication": "/api/v1/auth/",
                "users": "/api/v1/users/",
                "infrastructure": "/api/v1/infrastructure/",
                "assets": "/api/v1/assets/",
                "telecom": "/api/v1/telecom/",
                "ipam": "/api/v1/ipam/",
                "contracts": "/api/v1/contracts/",
                "phone_management": "/api/v1/phone-management/",
                "notifications": "/api/v1/notifications/",
                "user_stats": "/api/v1/stats/",
                "documentation": "/swagger/",
            },
            "note": (
                "Most endpoints require authentication. "
                "Use /api/v1/auth/users/ to register or "
                "/api/v1/auth/jwt/create/ to login."
            ),
        }
    )


@api_view(["GET", "PATCH", "PUT"])
@permission_classes([permissions.IsAuthenticated])
def company_profile_view(request: Request) -> Response:
    """
    Get or update singleton company profile.
    Uses DB row, falling back to Django settings defaults for initial creation.
    """
    defaults = getattr(settings, "COMPANY_PROFILE", {})
    profile, _created = CompanyProfile.objects.get_or_create(
        id=1,
        defaults={
            "company_name": defaults.get("company_name", "NetSentinel Corp"),
            "subdomain": defaults.get("subdomain", "netsentinel.app"),
            "company_url": defaults.get("company_url", ""),
            "main_contact": defaults.get("main_contact", "admin@netsentinel.com"),
            "phone_country": defaults.get("phone_country", "+1"),
            "phone_number": defaults.get("phone_number", ""),
            "phone_extension": defaults.get("phone_extension", ""),
        },
    )

    if request.method == "GET":
        return Response(CompanyProfileSerializer(profile).data)

    partial = request.method == "PATCH"
    serializer = CompanyProfileSerializer(profile, data=request.data, partial=partial)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)
