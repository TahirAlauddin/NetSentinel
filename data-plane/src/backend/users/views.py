from django.contrib.auth.models import Group, Permission
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.request import Request
from rest_framework.response import Response

from .models import PermissionBundle, User
from .serializers import (
    GroupDetailSerializer,
    GroupSerializer,
    PermissionBundleDetailSerializer,
    PermissionBundleSerializer,
    PermissionSerializer,
    UserAssignmentsUpdateSerializer,
)
from .services import get_user_stats


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def api_info_view(request: Request) -> Response:
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
def user_stats_view(request: Request) -> Response:
    """
    API view for user statistics (admin only).
    """
    if not request.user.is_staff:
        return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

    stats = get_user_stats()
    return Response(stats)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def current_user_permissions_view(request: Request) -> Response:
    """
    Return the list of permission codenames the current user has (Django + bundle permissions).
    Used by the frontend for RBAC UI (show/hide actions, nav items).
    """
    perms = list(request.user.get_all_permissions())
    return Response({"permissions": sorted(perms)})


class GroupViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing groups.
    Only superusers can manage groups.
    """

    queryset = (
        Group.objects.select_related("extended")
        .prefetch_related("permissions", "extended__bundles")
        .order_by("name")
    )
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return GroupDetailSerializer
        return GroupSerializer

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

    queryset = Permission.objects.select_related("content_type").order_by("id")
    serializer_class = PermissionSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = (
        "name",
        "codename",
        "content_type__app_label",
        "content_type__model",
    )

    def get_queryset(self):
        # Only superusers can access permissions
        if not self.request.user.is_superuser:
            return Permission.objects.none()
        return super().get_queryset()


class PermissionBundleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing PermissionBundles (CRUD).
    Only superusers can manage bundles.

    List  → PermissionBundleSerializer        (IDs only, lightweight)
    Detail → PermissionBundleDetailSerializer  (includes permissions_detail)
    """

    queryset = (
        PermissionBundle.objects.prefetch_related("permissions")
        .order_by("app", "code")
    )
    serializer_class = PermissionBundleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return PermissionBundleDetailSerializer
        return PermissionBundleSerializer

    def get_queryset(self):
        # Only superusers can access bundles
        if not self.request.user.is_superuser:
            return PermissionBundle.objects.none()
        return super().get_queryset()

    def perform_create(self, serializer):
        if not self.request.user.is_superuser:
            raise PermissionDenied("Only superusers can create permission bundles.")
        serializer.save()

    def perform_update(self, serializer):
        if not self.request.user.is_superuser:
            raise PermissionDenied("Only superusers can update permission bundles.")
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.is_superuser:
            raise PermissionDenied("Only superusers can delete permission bundles.")
        instance.delete()


@api_view(["GET", "PUT"])
@permission_classes([permissions.IsAuthenticated])
def user_assignments_view(request: Request, user_id: int) -> Response:
    """
    Admin-only endpoint to read/update a user's direct groups and permissions.
    """
    if not request.user.is_superuser:
        return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(
            {
                "group_ids": list(user.groups.values_list("id", flat=True)),
                "permission_ids": list(user.user_permissions.values_list("id", flat=True)),
            }
        )

    # PUT
    serializer = UserAssignmentsUpdateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    group_ids = serializer.validated_data["group_ids"]
    permission_ids = serializer.validated_data["permission_ids"]

    user.groups.set(Group.objects.filter(id__in=group_ids))
    user.user_permissions.set(Permission.objects.filter(id__in=permission_ids))

    return Response(
        {
            "success": True,
            "group_ids": list(user.groups.values_list("id", flat=True)),
            "permission_ids": list(user.user_permissions.values_list("id", flat=True)),
        }
    )
