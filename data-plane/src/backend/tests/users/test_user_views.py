"""
Tests for user-related API views.
"""

import pytest
from rest_framework import status


@pytest.mark.api
@pytest.mark.django_db
class TestAPIInfoView:
    """Test cases for API info endpoint."""

    def test_api_info_public_access(self, api_client):
        """Test that API info endpoint is publicly accessible."""
        response = api_client.get("/api/v1/users/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["message"] == "NetSentinel API is running!"
        assert data["version"] == "v1"
        assert "endpoints" in data

    def test_api_info_response_structure(self, api_client):
        """Test that API info response has correct structure."""
        response = api_client.get("/api/v1/users/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert "endpoints" in data
        assert "note" in data


@pytest.mark.api
@pytest.mark.django_db
class TestUserStatsView:
    """Test cases for user stats endpoint."""

    def test_user_stats_requires_authentication(self, api_client):
        """Test that user stats endpoint requires authentication."""
        response = api_client.get("/api/v1/users/stats/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_user_stats_requires_staff(self, authenticated_api_client, user):
        """Test that user stats endpoint requires staff permission."""
        response = authenticated_api_client.get("/api/v1/users/stats/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_user_stats_success(self, admin_api_client, user, admin_user):
        """Test that admin can access user stats."""
        response = admin_api_client.get("/api/v1/users/stats/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "total_users" in data
        assert "active_users" in data
        assert "staff_users" in data
        assert "superusers" in data
        assert data["total_users"] >= 2  # At least user and admin_user
        assert data["active_users"] >= 2
        assert data["superusers"] >= 1

    def test_user_stats_counts(self, admin_api_client, user, admin_user, another_user):
        """Test that user stats return correct counts."""
        response = admin_api_client.get("/api/v1/users/stats/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total_users"] == 3
        assert data["active_users"] == 3
        assert data["staff_users"] == 1
        assert data["superusers"] == 1


@pytest.mark.api
@pytest.mark.django_db
class TestGroupViewSet:
    """Test cases for Group ViewSet."""

    def test_list_groups_requires_authentication(self, api_client):
        """Test that listing groups requires authentication."""
        response = api_client.get("/api/v1/users/groups/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_groups_requires_superuser(self, authenticated_api_client):
        """Test that listing groups requires superuser permission."""
        response = authenticated_api_client.get("/api/v1/users/groups/")
        assert response.status_code == status.HTTP_200_OK
        # Non-superusers get empty queryset
        data = response.json()
        assert data["count"] == 0

    def test_list_groups_success(self, admin_api_client):
        """Test that superuser can list groups."""
        from django.contrib.auth.models import Group

        Group.objects.create(name="Test Group")
        response = admin_api_client.get("/api/v1/users/groups/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["count"] >= 1

    def test_create_group_requires_superuser(self, authenticated_api_client):
        """Test that creating a group requires superuser permission."""
        response = authenticated_api_client.post(
            "/api/v1/users/groups/",
            {"name": "New Group"},
            format="json",
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_group_success(self, admin_api_client):
        """Test that superuser can create a group."""
        response = admin_api_client.post(
            "/api/v1/users/groups/",
            {"name": "New Group"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == "New Group"


@pytest.mark.api
@pytest.mark.django_db
class TestPermissionViewSet:
    """Test cases for Permission ViewSet."""

    def test_list_permissions_requires_authentication(self, api_client):
        """Test that listing permissions requires authentication."""
        response = api_client.get("/api/v1/users/permissions/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_permissions_requires_superuser(self, authenticated_api_client):
        """Test that listing permissions requires superuser permission."""
        response = authenticated_api_client.get("/api/v1/users/permissions/")
        assert response.status_code == status.HTTP_200_OK
        # Non-superusers get empty queryset
        data = response.json()
        assert data["count"] == 0

    def test_list_permissions_success(self, admin_api_client):
        """Test that superuser can list permissions."""
        response = admin_api_client.get("/api/v1/users/permissions/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "results" in data or "count" in data
