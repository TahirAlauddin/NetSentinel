from django.contrib.auth.models import Group, Permission
from django.db import IntegrityError, transaction
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.request import Request
from rest_framework.response import Response

from .models import ExtendedGroup, PermissionBundle, User
from .serializers import (
    GroupDetailSerializer,
    GroupSerializer,
    PermissionBundleDetailSerializer,
    PermissionBundleSerializer,
    PermissionSerializer,
    UserAssignmentsUpdateSerializer,
)
from .services import get_user_stats

APP_KEY_TO_LABELS = {
    "assets": ["assets"],
    "contracts": ["contracts"],
    "ipam": ["ipam"],
    "telecom": ["telecom"],
    "phone_mgmt": ["phone_management"],
    "users": [
        "users",
        "infrastructure",
        "notifications",
        "auth",
        "admin",
        "contenttypes",
        "sessions",
    ],
}

LEVEL_TO_PREFIXES = {
    "read": ["view_"],
    "edit": ["view_", "change_"],
    "admin": ["view_", "add_", "change_", "delete_"],
}


def _validate_access_level_item(item):
    """Validate a single app_access_levels entry and return (app, level)."""
    if not isinstance(item, dict):
        raise ValueError("Each app_access_levels item must be an object.")
    app = item.get("app")
    level = item.get("level")
    if app not in APP_KEY_TO_LABELS:
        raise ValueError(f"Unsupported app key: {app}")
    if level not in ("none", "read", "edit", "admin"):
        raise ValueError(f"Unsupported access level: {level}")
    return app, level


def _collect_bundle_perms(app_label, level):
    """Return (all_permission_ids, per_bundle_permission_ids) for one app_label + level."""
    all_ids: set = set()
    bundle_ids: set = set()
    for prefix in LEVEL_TO_PREFIXES[level]:
        ids = set(
            Permission.objects.filter(
                content_type__app_label=app_label,
                codename__startswith=prefix,
            ).values_list("id", flat=True)
        )
        all_ids.update(ids)
        bundle_ids.update(ids)
    return all_ids, bundle_ids


def _upsert_bundle(code, spec, existing_by_code):
    """Get-or-create a PermissionBundle for *code* and sync its permissions."""
    bundle = existing_by_code.get(code)
    app_title = spec["app_label"].replace("_", " ").title()
    level_title = spec["level"].title()
    if bundle is None:
        bundle = PermissionBundle.objects.create(
            code=code,
            name=f"{app_title} {level_title} All",
            app=spec["app_label"],
            description=f"Auto-generated app-level bundle for {app_title} ({level_title}).",
        )
    bundle.permissions.set(Permission.objects.filter(id__in=spec["permission_ids"]))
    return bundle


def _resolve_app_level_permissions_and_bundles(app_access_levels):
    """
    Translate UI app-level selections into concrete Django permission IDs
    and persisted PermissionBundle IDs.
    """
    if not isinstance(app_access_levels, list):
        raise ValueError("app_access_levels must be a list.")

    permission_ids: set = set()
    bundle_specs: dict = {}

    for item in app_access_levels:
        app, level = _validate_access_level_item(item)
        if level == "none":
            continue
        for app_label in APP_KEY_TO_LABELS[app]:
            all_ids, per_bundle_ids = _collect_bundle_perms(app_label, level)
            permission_ids.update(all_ids)
            bundle_specs[f"{app_label}_{level}_all"] = {
                "app_label": app_label,
                "level": level,
                "permission_ids": sorted(per_bundle_ids),
            }

    existing_by_code = {
        b.code: b for b in PermissionBundle.objects.filter(code__in=bundle_specs.keys())
    }
    bundle_ids = [
        _upsert_bundle(code, spec, existing_by_code).id for code, spec in bundle_specs.items()
    ]

    return sorted(permission_ids), sorted(bundle_ids)


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

    queryset = PermissionBundle.objects.prefetch_related("permissions").order_by("app", "code")
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


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def create_group_from_permission_bundles_view(request: Request) -> Response:
    """Create a group from app-level access choices supplied by the UI."""
    if not request.user.is_superuser:
        return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

    name = (request.data.get("name") or "").strip()
    if not name:
        return Response({"error": "Group name is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        permission_ids, bundle_ids = _resolve_app_level_permissions_and_bundles(
            request.data.get("app_access_levels", [])
        )
    except ValueError as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            group = Group.objects.create(name=name)
            group.permissions.set(Permission.objects.filter(id__in=permission_ids))
            ext, _ = ExtendedGroup.objects.get_or_create(group=group)
            ext.bundles.set(PermissionBundle.objects.filter(id__in=bundle_ids))
    except IntegrityError:
        return Response(
            {"error": "A group with this name already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {
            "success": True,
            "id": group.id,
            "name": group.name,
            "permission_ids": permission_ids,
            "permission_bundle_ids": bundle_ids,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["PUT"])
@permission_classes([permissions.IsAuthenticated])
def update_group_from_permission_bundles_view(request: Request, group_id: int) -> Response:
    """Update an existing group from app-level access choices supplied by the UI."""
    if not request.user.is_superuser:
        return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

    try:
        group = Group.objects.get(pk=group_id)
    except Group.DoesNotExist:
        return Response({"error": "Group not found."}, status=status.HTTP_404_NOT_FOUND)

    name = (request.data.get("name") or "").strip()
    if not name:
        return Response({"error": "Group name is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        permission_ids, bundle_ids = _resolve_app_level_permissions_and_bundles(
            request.data.get("app_access_levels", [])
        )
    except ValueError as exc:
        return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            group.name = name
            group.save(update_fields=["name"])
            group.permissions.set(Permission.objects.filter(id__in=permission_ids))
            ext, _ = ExtendedGroup.objects.get_or_create(group=group)
            ext.bundles.set(PermissionBundle.objects.filter(id__in=bundle_ids))
    except IntegrityError:
        return Response(
            {"error": "A group with this name already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    return Response(
        {
            "success": True,
            "id": group.id,
            "name": group.name,
            "permission_ids": permission_ids,
            "permission_bundle_ids": bundle_ids,
        }
    )
