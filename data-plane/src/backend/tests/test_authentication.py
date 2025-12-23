"""
Tests for authentication endpoints (JWT and Djoser).
"""

import pytest
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


@pytest.mark.api
@pytest.mark.django_db
class TestJWTAuthentication:
    """Test cases for JWT token authentication."""

    def test_jwt_token_creation(self, user):
        """Test that JWT tokens can be created for a user."""
        refresh = RefreshToken.for_user(user)
        assert refresh is not None
        assert refresh.access_token is not None
        assert str(refresh.access_token) != ""

    def test_jwt_token_creation_api(self, api_client, user):
        """Test JWT token creation via API endpoint."""
        response = api_client.post(
            "/api/v1/auth/jwt/create/",
            {
                "username": user.username,
                "password": "testpass123",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data
        assert response.data["access"] != ""
        assert response.data["refresh"] != ""

    def test_jwt_token_creation_invalid_credentials(self, api_client):
        """Test that invalid credentials return 401."""
        response = api_client.post(
            "/api/v1/auth/jwt/create/",
            {
                "username": "nonexistent",
                "password": "wrongpassword",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_jwt_token_refresh(self, api_client, user):
        """Test that refresh token can be used to get new access token."""
        # First, get tokens
        create_response = api_client.post(
            "/api/v1/auth/jwt/create/",
            {
                "username": user.username,
                "password": "testpass123",
            },
            format="json",
        )
        assert create_response.status_code == status.HTTP_200_OK
        refresh_token = create_response.data["refresh"]

        # Use refresh token to get new access token
        refresh_response = api_client.post(
            "/api/v1/auth/jwt/refresh/",
            {"refresh": refresh_token},
            format="json",
        )
        assert refresh_response.status_code == status.HTTP_200_OK
        assert "access" in refresh_response.data

    def test_jwt_token_refresh_invalid_token(self, api_client):
        """Test that invalid refresh token returns 401."""
        response = api_client.post(
            "/api/v1/auth/jwt/refresh/",
            {"refresh": "invalid_token"},
            format="json",
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_jwt_token_verify(self, api_client, user):
        """Test that access token can be verified."""
        # Get tokens
        create_response = api_client.post(
            "/api/v1/auth/jwt/create/",
            {
                "username": user.username,
                "password": "testpass123",
            },
            format="json",
        )
        assert create_response.status_code == status.HTTP_200_OK
        access_token = create_response.data["access"]

        # Verify token
        verify_response = api_client.post(
            "/api/v1/auth/jwt/verify/",
            {"token": access_token},
            format="json",
        )
        assert verify_response.status_code == status.HTTP_200_OK

    def test_jwt_token_verify_invalid_token(self, api_client):
        """Test that invalid token verification returns 401."""
        response = api_client.post(
            "/api/v1/auth/jwt/verify/",
            {"token": "invalid_token"},
            format="json",
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_authenticated_request_with_token(self, api_client, user):
        """Test that authenticated requests work with JWT token."""
        # Get token
        token_response = api_client.post(
            "/api/v1/auth/jwt/create/",
            {
                "username": user.username,
                "password": "testpass123",
            },
            format="json",
        )
        access_token = token_response.data["access"]

        # Use token for authenticated request
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = api_client.get("/api/v1/users/stats/")
        # Should get 403 (not authorized) or 200 (if user is staff), but not 401
        assert response.status_code != status.HTTP_401_UNAUTHORIZED


@pytest.mark.api
@pytest.mark.django_db
class TestDjoserRegistration:
    """Test cases for Djoser user registration."""

    def test_user_registration_success(self, api_client):
        """Test that user can register via Djoser."""
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "securepass123",
            "re_password": "securepass123",
            "first_name": "New",
            "last_name": "User",
        }
        response = api_client.post(
            "/api/v1/auth/users/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["username"] == "newuser"
        assert response.data["email"] == "newuser@example.com"
        assert "password" not in response.data  # Password should not be in response

    def test_user_registration_password_mismatch(self, api_client):
        """Test that password mismatch returns error."""
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "securepass123",
            "re_password": "differentpass",
            "first_name": "New",
            "last_name": "User",
        }
        response = api_client.post(
            "/api/v1/auth/users/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_user_registration_duplicate_username(self, api_client, user):
        """Test that duplicate username returns error."""
        data = {
            "username": user.username,
            "email": "different@example.com",
            "password": "securepass123",
            "re_password": "securepass123",
        }
        response = api_client.post(
            "/api/v1/auth/users/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_user_registration_duplicate_email(self, api_client, user):
        """Test that duplicate email returns error."""
        data = {
            "username": "differentuser",
            "email": user.email,
            "password": "securepass123",
            "re_password": "securepass123",
        }
        response = api_client.post(
            "/api/v1/auth/users/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.api
@pytest.mark.django_db
class TestDjoserUserManagement:
    """Test cases for Djoser user management endpoints."""

    def test_get_current_user(self, authenticated_api_client, user):
        """Test that authenticated user can get their profile."""
        response = authenticated_api_client.get("/api/v1/auth/users/me/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["username"] == user.username
        assert response.data["email"] == user.email

    def test_get_current_user_requires_auth(self, api_client):
        """Test that getting current user requires authentication."""
        response = api_client.get("/api/v1/auth/users/me/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_update_current_user(self, authenticated_api_client, user):
        """Test that authenticated user can update their profile."""
        data = {
            "username": user.username,
            "email": user.email,
            "first_name": "Updated",
            "last_name": "Name",
        }
        response = authenticated_api_client.patch(
            "/api/v1/auth/users/me/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["first_name"] == "Updated"
        assert response.data["last_name"] == "Name"
