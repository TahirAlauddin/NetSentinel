from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.request import Request
from rest_framework.response import Response


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
                "infrastructure": "/api/v1/infrastructure/",
                "assets": "/api/v1/assets/",
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
