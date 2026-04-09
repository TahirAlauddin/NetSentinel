"""
RBAC-specific pytest fixtures.

Provides ready-made users, groups, bundles, and API clients scoped to specific apps
so cross-app isolation tests can share a common setup without boilerplate.
"""

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import ExtendedGroup, PermissionBundle

User = get_user_model()

# ---------------------------------------------------------------------------
# Low-level factories
# ---------------------------------------------------------------------------


@pytest.fixture
def make_permission(db):
    """Factory: create (or get) a Django Permission on a given content type."""

    def _factory(app_label, model_name, codename, name=None):
        ct, _ = ContentType.objects.get_or_create(
            app_label=app_label, model=model_name
        )
        perm, _ = Permission.objects.get_or_create(
            codename=codename,
            content_type=ct,
            defaults={"name": name or f"Can {codename}"},
        )
        return perm

    return _factory


@pytest.fixture
def make_bundle(db):
    """Factory: create a PermissionBundle with an optional list of Permission objects."""

    _counter = [0]

    def _factory(code, name=None, app=None, permissions=None):
        _counter[0] += 1
        bundle = PermissionBundle.objects.create(
            code=code,
            name=name or f"Bundle {code}",
            app=app,
        )
        if permissions:
            bundle.permissions.set(permissions)
        return bundle

    return _factory


@pytest.fixture
def make_group_with_bundles(db):
    """Factory: create a Django Group + ExtendedGroup wired to the given bundles."""

    def _factory(name, bundles=None):
        group = Group.objects.create(name=name)
        ext = ExtendedGroup.objects.create(group=group)
        if bundles:
            ext.bundles.set(bundles)
        return group

    return _factory


@pytest.fixture
def make_user(db):
    """Factory: create a plain (non-staff, non-superuser) user."""

    _counter = [0]

    def _factory(username=None, password="testpass123", groups=None, perms=None):
        _counter[0] += 1
        u = User.objects.create_user(
            username=username or f"rbacuser_{_counter[0]}",
            email=f"rbacuser_{_counter[0]}@example.com",
            password=password,
        )
        if groups:
            u.groups.set(groups)
        if perms:
            u.user_permissions.set(perms)
        return u

    return _factory


@pytest.fixture
def make_jwt_client(db):
    """Factory: return a JWT-authenticated APIClient for the given user."""

    def _factory(user):
        client = APIClient()
        refresh = RefreshToken.for_user(user)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
        client.user = user
        return client

    return _factory


# ---------------------------------------------------------------------------
# App-scoped bundle + user fixtures
# ---------------------------------------------------------------------------


def _bundle_for_app(app_label, level, permissions_qs):
    """Helper: get-or-create an auto-bundle for app_label at read/edit/admin level."""
    code = f"{app_label}_{level}_all"
    bundle, _ = PermissionBundle.objects.get_or_create(
        code=code,
        defaults={
            "name": f"{app_label.title()} {level.title()} All",
            "app": app_label,
        },
    )
    bundle.permissions.set(permissions_qs)
    return bundle


def _make_app_user(app_label, level, username):
    """Create a user whose permissions come via bundle → group → ExtendedGroup."""
    prefixes = {
        "read": ["view_"],
        "edit": ["view_", "change_"],
        "admin": ["view_", "add_", "change_", "delete_"],
    }[level]

    qs = Permission.objects.filter(content_type__app_label=app_label)
    perms = qs.filter(
        codename__startswith=prefixes[0]  # start with first prefix
    )
    for p in prefixes[1:]:
        perms = perms | qs.filter(codename__startswith=p)
    perms = perms.distinct()

    bundle = _bundle_for_app(app_label, level, perms)

    group = Group.objects.create(name=f"{username}_group")
    ext = ExtendedGroup.objects.create(group=group)
    ext.bundles.add(bundle)

    user = User.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="testpass123",
    )
    user.groups.add(group)
    return user


@pytest.fixture
def ipam_read_user(db):
    """User whose only permissions are view_ on the ipam app (via bundle)."""
    return _make_app_user("ipam", "read", "ipam_read_user")


@pytest.fixture
def ipam_admin_user(db):
    """User with full CRUD permissions on the ipam app (via bundle)."""
    return _make_app_user("ipam", "admin", "ipam_admin_user")


@pytest.fixture
def assets_read_user(db):
    """User whose only permissions are view_ on the assets app (via bundle)."""
    return _make_app_user("assets", "read", "assets_read_user")


@pytest.fixture
def assets_admin_user(db):
    """User with full CRUD permissions on the assets app (via bundle)."""
    return _make_app_user("assets", "admin", "assets_admin_user")


@pytest.fixture
def contracts_read_user(db):
    """User whose only permissions are view_ on the contracts app (via bundle)."""
    return _make_app_user("contracts", "read", "contracts_read_user")


@pytest.fixture
def contracts_admin_user(db):
    """User with full CRUD permissions on the contracts app (via bundle)."""
    return _make_app_user("contracts", "admin", "contracts_admin_user")


@pytest.fixture
def no_perm_user(db):
    """Authenticated user with zero permissions."""
    return User.objects.create_user(
        username="nopermuser",
        email="noperm@example.com",
        password="testpass123",
    )


@pytest.fixture
def superuser(db):
    """Superuser (all permissions)."""
    return User.objects.create_superuser(
        username="superuser_rbac",
        email="superuser_rbac@example.com",
        password="superpass123",
    )


# ---------------------------------------------------------------------------
# Convenience authenticated clients for app-scoped users
# ---------------------------------------------------------------------------


@pytest.fixture
def ipam_read_client(ipam_read_user):
    client = APIClient()
    client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(ipam_read_user).access_token}"
    )
    client.user = ipam_read_user
    return client


@pytest.fixture
def ipam_admin_client(ipam_admin_user):
    client = APIClient()
    client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(ipam_admin_user).access_token}"
    )
    client.user = ipam_admin_user
    return client


@pytest.fixture
def assets_read_client(assets_read_user):
    client = APIClient()
    client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(assets_read_user).access_token}"
    )
    client.user = assets_read_user
    return client


@pytest.fixture
def assets_admin_client(assets_admin_user):
    client = APIClient()
    client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(assets_admin_user).access_token}"
    )
    client.user = assets_admin_user
    return client


@pytest.fixture
def contracts_read_client(contracts_read_user):
    client = APIClient()
    client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(contracts_read_user).access_token}"
    )
    client.user = contracts_read_user
    return client


@pytest.fixture
def no_perm_client(no_perm_user):
    client = APIClient()
    client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(no_perm_user).access_token}"
    )
    client.user = no_perm_user
    return client


@pytest.fixture
def superuser_client(superuser):
    client = APIClient()
    client.credentials(
        HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(superuser).access_token}"
    )
    client.user = superuser
    return client


@pytest.fixture
def anon_client():
    """Unauthenticated API client."""
    return APIClient()
