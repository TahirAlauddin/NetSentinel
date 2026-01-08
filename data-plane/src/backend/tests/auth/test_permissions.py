"""
Tests for permission system (AppPermissions and ViewSet permissions).
"""

import pytest
from django.contrib.auth.models import Group
from rest_framework import status

from users.models import AppPermission, AppPermissionGroup


@pytest.mark.django_db
class TestAppPermissionSystem:
    """Test cases for AppPermission system."""

    def test_direct_app_permission(self, user):
        """Test assigning permission directly to user."""
        permission = AppPermission.objects.create(
            codename="view_assets",
            name="View Assets",
            category="assets",
        )
        user.app_permissions.add(permission)
        assert user.has_app_permission("view_assets") is True

    def test_group_based_app_permission(self, user):
        """Test assigning permission through group."""
        permission = AppPermission.objects.create(
            codename="create_assets",
            name="Create Assets",
            category="assets",
        )
        group = Group.objects.create(name="Asset Managers")
        user.groups.add(group)
        AppPermissionGroup.objects.create(group=group, permission=permission)
        assert user.has_app_permission("create_assets") is True

    def test_superuser_has_all_permissions(self, admin_user):
        """Test that superuser has all permissions."""
        AppPermission.objects.create(
            codename="test_permission",
            name="Test Permission",
            category="test",
        )
        assert admin_user.has_app_permission("test_permission") is True
        # Even without explicit assignment
        assert admin_user.has_app_permission("nonexistent_permission") is True

    def test_user_without_permission(self, user):
        """Test that user without permission returns False."""
        assert user.has_app_permission("view_assets") is False

    def test_has_any_app_permission(self, user):
        """Test has_any_app_permission method."""
        permission1 = AppPermission.objects.create(
            codename="permission1",
            name="Permission 1",
            category="test",
        )
        user.app_permissions.add(permission1)
        assert user.has_any_app_permission(["permission1", "permission2"]) is True
        assert user.has_any_app_permission(["permission2", "permission3"]) is False

    def test_has_all_app_permissions(self, user):
        """Test has_all_app_permissions method."""
        permission1 = AppPermission.objects.create(
            codename="permission1",
            name="Permission 1",
            category="test",
        )
        permission2 = AppPermission.objects.create(
            codename="permission2",
            name="Permission 2",
            category="test",
        )
        user.app_permissions.add(permission1, permission2)
        assert user.has_all_app_permissions(["permission1", "permission2"]) is True
        assert user.has_all_app_permissions(["permission1", "permission3"]) is False

    def test_inactive_permission_not_granted(self, user):
        """Test that inactive permissions are not granted."""
        permission = AppPermission.objects.create(
            codename="inactive_permission",
            name="Inactive Permission",
            category="test",
            is_active=False,
        )
        user.app_permissions.add(permission)
        assert user.has_app_permission("inactive_permission") is False

    def test_get_app_permissions(self, user):
        """Test get_app_permissions method returns all user permissions."""
        permission1 = AppPermission.objects.create(
            codename="permission1",
            name="Permission 1",
            category="test",
        )
        permission2 = AppPermission.objects.create(
            codename="permission2",
            name="Permission 2",
            category="test",
        )
        user.app_permissions.add(permission1)
        group = Group.objects.create(name="Test Group")
        user.groups.add(group)
        AppPermissionGroup.objects.create(group=group, permission=permission2)

        permissions = user.get_app_permissions()
        assert permissions.count() == 2
        assert permission1 in permissions
        assert permission2 in permissions


@pytest.mark.api
@pytest.mark.django_db
class TestViewSetPermissions:
    """Test cases for ViewSet permission checks."""

    def test_authenticated_endpoint_requires_auth(self, api_client):
        """Test that authenticated endpoints require authentication."""
        response = api_client.get("/api/v1/infrastructure/locations/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_authenticated_endpoint_with_token(self, authenticated_api_client):
        """Test that authenticated endpoints work with valid token."""
        response = authenticated_api_client.get("/api/v1/infrastructure/locations/")
        assert response.status_code == status.HTTP_200_OK

    def test_staff_only_endpoint_requires_staff(self, authenticated_api_client, user):
        """Test that staff-only endpoints require staff permission."""
        response = authenticated_api_client.get("/api/v1/users/stats/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_staff_only_endpoint_with_staff(self, admin_api_client):
        """Test that staff-only endpoints work with staff user."""
        response = admin_api_client.get("/api/v1/users/stats/")
        assert response.status_code == status.HTTP_200_OK

    def test_superuser_only_endpoint_requires_superuser(self, authenticated_api_client, user):
        """Test that superuser-only endpoints require superuser permission."""
        response = authenticated_api_client.get("/api/v1/users/groups/")
        assert response.status_code == status.HTTP_200_OK
        # Non-superusers get empty queryset
        assert response.data["count"] == 0

    def test_superuser_only_endpoint_with_superuser(self, admin_api_client):
        """Test that superuser-only endpoints work with superuser."""
        from django.contrib.auth.models import Group

        Group.objects.create(name="Test Group")
        response = admin_api_client.get("/api/v1/users/groups/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 1

    def test_public_endpoint_no_auth_required(self, api_client):
        """Test that public endpoints don't require authentication."""
        response = api_client.get("/api/v1/users/")
        assert response.status_code == status.HTTP_200_OK

    def test_public_endpoint_no_auth_required_health(self, api_client):
        """Test that health endpoint doesn't require authentication."""
        response = api_client.get("/api/health/")
        assert response.status_code == status.HTTP_200_OK
