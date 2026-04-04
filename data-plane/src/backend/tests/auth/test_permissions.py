"""
Tests for permission system (bundles, Django Permission, ViewSet access).
"""

import pytest
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth import get_user_model
from rest_framework import status

from tests.rbac_helpers import grant_user_permission_through_bundle
from users.models import ExtendedGroup


@pytest.mark.django_db
class TestBundlePermissionSystem:
    """Tests for PermissionBundle + ExtendedGroup resolution via has_perm()."""

    def test_permission_through_bundle_and_group(self, user):
        perm_str = grant_user_permission_through_bundle(user, codename="view_assets_bundle")
        assert user.has_perm(perm_str) is True

    def test_superuser_has_arbitrary_perm(self, admin_user):
        UserModel = get_user_model()
        ct = ContentType.objects.get_for_model(UserModel)
        assert admin_user.has_perm(f"{ct.app_label}.any_fake_codename") is True

    def test_user_without_permission(self, user):
        UserModel = get_user_model()
        ct = ContentType.objects.get_for_model(UserModel)
        assert user.has_perm(f"{ct.app_label}.nonexistent_permission_xyz") is False

    def test_standard_group_permission_still_works(self, user):
        """Permissions attached directly to Group.permissions are unchanged."""
        UserModel = get_user_model()
        ct = ContentType.objects.get_for_model(UserModel)
        codename = f"direct_group_perm_{user.pk}"
        perm, _ = Permission.objects.get_or_create(
            codename=codename,
            content_type=ct,
            defaults={"name": f"Can {codename}"},
        )
        group = Group.objects.create(name=f"direct_{user.pk}")
        group.permissions.add(perm)
        user.groups.add(group)
        assert user.has_perm(f"{ct.app_label}.{codename}") is True

    def test_group_without_extended_still_gets_direct_perms(self, user):
        UserModel = get_user_model()
        ct = ContentType.objects.get_for_model(UserModel)
        codename = f"no_ext_{user.pk}"
        perm, _ = Permission.objects.get_or_create(
            codename=codename,
            content_type=ct,
            defaults={"name": f"Can {codename}"},
        )
        group = Group.objects.create(name=f"plain_{user.pk}")
        group.permissions.add(perm)
        user.groups.add(group)
        assert ExtendedGroup.objects.filter(group=group).exists() is False
        assert user.has_perm(f"{ct.app_label}.{codename}") is True


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
