from django.contrib.auth.models import Group, Permission
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from .models import User
from .serializers import GroupSerializer, PermissionSerializer


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def api_info_view(request):
    """
    Public API information endpoint for testing browsable API.
    """
    return Response(
        {
            "message": "NetSentinel API is running!",
            "version": "v1",
            "endpoints": {
                "authentication": "/api/v1/auth/",
                "user_stats": "/api/v1/stats/",
                "documentation": "/swagger/",
            },
            "note": "Most endpoints require authentication. \
Use /api/v1/auth/users/ to register or /api/v1/auth/jwt/create/ to login.",
        }
    )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def user_stats_view(request):
    """
    API view for user statistics (admin only).
    """
    if not request.user.is_staff:
        return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

    stats = {
        "total_users": User.objects.count(),
        "active_users": User.objects.filter(is_active=True).count(),
        "staff_users": User.objects.filter(is_staff=True).count(),
        "superusers": User.objects.filter(is_superuser=True).count(),
    }

    return Response(stats)


class GroupViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing groups.
    Only superusers can manage groups.
    """

    queryset = Group.objects.prefetch_related("permissions").order_by("name")
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only superusers can access groups
        if not self.request.user.is_superuser:
            return Group.objects.none()
        return super().get_queryset()

    def perform_create(self, serializer):
        # Only superusers can create groups
        if not self.request.user.is_superuser:
            raise PermissionDenied("Only superusers can create groups.")
        serializer.save()

    def perform_update(self, serializer):
        # Only superusers can update groups
        if not self.request.user.is_superuser:
            raise PermissionDenied("Only superusers can update groups.")
        serializer.save()

    def perform_destroy(self, instance):
        # Only superusers can delete groups
        if not self.request.user.is_superuser:
            raise PermissionDenied("Only superusers can delete groups.")
        instance.delete()


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for listing permissions (read-only).
    Only superusers can view permissions.
    """

    queryset = Permission.objects.select_related("content_type").all()
    serializer_class = PermissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only superusers can access permissions
        if not self.request.user.is_superuser:
            return Permission.objects.none()
        return super().get_queryset()
