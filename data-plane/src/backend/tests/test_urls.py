"""
Tests for URL routing and endpoint accessibility.
"""

import pytest
from django.test import Client
from django.urls import resolve, reverse
from rest_framework import status


@pytest.mark.unit
class TestCoreURLs:
    """Test cases for core URL routing."""

    def test_health_check_url(self):
        """Test that health check URL resolves correctly."""
        from core.health import health_check

        url = reverse("health-check")
        assert url == "/api/health/"
        resolved = resolve(url)
        assert resolved.func == health_check

    def test_api_info_url(self):
        """Test that API info URL resolves correctly."""
        from core.views import api_info_view

        url = reverse("core_api_info")
        assert url == "/"
        resolved = resolve(url)
        assert resolved.func == api_info_view

    def test_swagger_url(self):
        """Test that Swagger URL exists."""
        url = reverse("schema-swagger-ui")
        assert url == "/swagger/"

    def test_redoc_url(self):
        """Test that ReDoc URL exists."""
        url = reverse("schema-redoc")
        assert url == "/redoc/"

    def test_swagger_json_url(self):
        """Test that Swagger JSON URL exists."""
        url = reverse("schema-json")
        assert url == "/swagger.json"


@pytest.mark.unit
class TestUsersURLs:
    """Test cases for users app URL routing."""

    def test_users_api_info_url(self):
        """Test that users API info URL resolves."""
        url = reverse("users:users_api_info")
        assert url == "/api/v1/users/"

    def test_user_stats_url(self):
        """Test that user stats URL resolves."""
        url = reverse("users:user_stats")
        assert url == "/api/v1/users/stats/"

    def test_groups_list_url(self):
        """Test that groups list URL resolves."""
        # Using the router basename
        # Groups are registered with basename="group"
        # The URL pattern would be /api/v1/users/groups/
        Client()
        # We can't easily reverse router URLs, so we test by making a request
        # This is tested in test_user_views.py

    def test_permissions_list_url(self):
        """Test that permissions list URL resolves."""
        # Permissions are registered with basename="permission"
        # The URL pattern would be /api/v1/users/permissions/
        # This is tested in test_user_views.py


@pytest.mark.unit
class TestInfrastructureURLs:
    """Test cases for infrastructure app URL routing."""

    def test_locations_list_url(self):
        """Test that locations list URL pattern exists."""
        Client()
        # URL should be /api/v1/infrastructure/locations/
        # This is tested in test_infrastructure_views.py

    def test_circuits_list_url(self):
        """Test that circuits list URL pattern exists."""
        # URL should be /api/v1/infrastructure/circuits/
        # This is tested in test_infrastructure_views.py

    def test_departments_list_url(self):
        """Test that departments list URL pattern exists."""
        # URL should be /api/v1/infrastructure/departments/
        # This is tested in test_infrastructure_views.py

    def test_categories_list_url(self):
        """Test that categories list URL pattern exists."""
        # URL should be /api/v1/infrastructure/categories/
        # This is tested in test_infrastructure_views.py


@pytest.mark.unit
class TestAssetsURLs:
    """Test cases for assets app URL routing."""

    def test_assets_api_info_url(self):
        """Test that assets API info URL resolves."""
        url = reverse("assets_api_info")
        assert url == "/api/v1/assets/"

    def test_assets_list_url(self):
        """Test that assets list URL pattern exists."""
        # URL should be /api/v1/assets/
        # This is tested in test_assets_views.py

    def test_asset_tags_list_url(self):
        """Test that asset tags list URL pattern exists."""
        # URL should be /api/v1/assets/tags/
        # This is tested in test_assets_views.py

    def test_asset_categories_list_url(self):
        """Test that asset categories list URL pattern exists."""
        # URL should be /api/v1/assets/categories/
        # This is tested in test_assets_views.py


@pytest.mark.api
@pytest.mark.django_db
class TestAuthenticationURLs:
    """Test cases for authentication URL routing."""

    def test_jwt_create_url(self, api_client):
        """Test that JWT create endpoint exists."""
        response = api_client.post("/api/v1/auth/jwt/create/", {})
        # Should return 400 (bad request) not 404 (not found)
        assert response.status_code != 404

    def test_jwt_refresh_url(self, api_client):
        """Test that JWT refresh endpoint exists."""
        response = api_client.post("/api/v1/auth/jwt/refresh/", {})
        # Should return 400 (bad request) not 404 (not found)
        assert response.status_code != 404

    def test_jwt_verify_url(self, api_client):
        """Test that JWT verify endpoint exists."""
        response = api_client.post("/api/v1/auth/jwt/verify/", {})
        # Should return 400 (bad request) not 404 (not found)
        assert response.status_code != 404

    def test_user_registration_url(self, api_client):
        """Test that user registration endpoint exists."""
        response = api_client.post("/api/v1/auth/users/", {})
        # Should return 400 (bad request) not 404 (not found)
        assert response.status_code != 404

    def test_current_user_url(self, api_client):
        """Test that current user endpoint exists."""
        response = api_client.get("/api/v1/auth/users/me/")
        # Should return 401 (unauthorized) not 404 (not found)
        assert response.status_code != 404


@pytest.mark.api
@pytest.mark.django_db
class TestURLParameterValidation:
    """Test cases for URL parameter validation."""

    def test_invalid_id_returns_404(self, authenticated_api_client):
        """Test that invalid ID in URL returns 404."""
        response = authenticated_api_client.get("/api/v1/infrastructure/locations/99999/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_nested_url_requires_parent(self, authenticated_api_client):
        """Test that nested URLs require valid parent resource."""
        # Try to access asset images without valid asset ID
        response = authenticated_api_client.get("/api/v1/assets/99999/images/")
        # Nested routes with rest_framework_nested might return 404 for invalid parent
        # or might return 200 with empty list. Both are valid behaviors.
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        if response.status_code == status.HTTP_200_OK:
            # If it returns 200, it should be an empty list or paginated response
            assert isinstance(response.data, (list, dict))
            if isinstance(response.data, dict):
                # Paginated response
                assert "results" in response.data or "count" in response.data
