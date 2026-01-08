"""
Pytest configuration and shared fixtures for the NetSentinel data plane backend.
"""

import pytest


@pytest.fixture
def api_client():
    """Provides an unauthenticated API client."""
    from rest_framework.test import APIClient

    return APIClient()


@pytest.fixture
def authenticated_api_client(db, user):
    """Provides an authenticated API client with a user token."""
    from rest_framework.test import APIClient
    from rest_framework_simplejwt.tokens import RefreshToken

    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


@pytest.fixture
def admin_api_client(db, admin_user):
    """Provides an authenticated API client with an admin user token."""
    from rest_framework.test import APIClient
    from rest_framework_simplejwt.tokens import RefreshToken

    client = APIClient()
    refresh = RefreshToken.for_user(admin_user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


@pytest.fixture
def user(db):
    """Creates a regular user for testing."""
    from django.contrib.auth import get_user_model

    User = get_user_model()

    return User.objects.create_user(
        username="testuser",
        email="testuser@example.com",
        password="testpass123",
        first_name="Test",
        last_name="User",
    )


@pytest.fixture
def admin_user(db):
    """Creates an admin user for testing."""
    from django.contrib.auth import get_user_model

    User = get_user_model()

    return User.objects.create_user(
        username="admin",
        email="admin@example.com",
        password="adminpass123",
        first_name="Admin",
        last_name="User",
        is_staff=True,
        is_superuser=True,
    )


@pytest.fixture
def another_user(db):
    """Creates another regular user for testing."""
    from django.contrib.auth import get_user_model

    User = get_user_model()

    return User.objects.create_user(
        username="anotheruser",
        email="anotheruser@example.com",
        password="testpass123",
        first_name="Another",
        last_name="User",
    )
