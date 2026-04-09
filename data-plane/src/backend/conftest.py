"""
Pytest configuration and shared fixtures for the NetSentinel data plane backend.
"""

import pytest


def grant_all_django_permissions_for_app(user, app_label: str) -> None:
    """Attach every Permission for models in ``app_label`` (e.g. ``assets``) to ``user``."""
    from django.contrib.auth.models import Permission

    perm_list = list(Permission.objects.filter(content_type__app_label=app_label))
    if perm_list:
        user.user_permissions.add(*perm_list)


@pytest.fixture
def user_with_assets_perms(db, user):
    """Regular user with all ``assets`` Django model permissions (for ViewSets using
    DjangoModelPermissions)."""
    grant_all_django_permissions_for_app(user, "assets")
    return user


@pytest.fixture
def authenticated_api_client_with_assets_perms(db, user_with_assets_perms):
    """JWT-authenticated API client whose user has full ``assets`` model permissions."""
    from rest_framework.test import APIClient
    from rest_framework_simplejwt.tokens import RefreshToken

    client = APIClient()
    refresh = RefreshToken.for_user(user_with_assets_perms)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    client.user = user_with_assets_perms
    return client


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
    # Attach user to client for tests that need it
    client.user = user
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
