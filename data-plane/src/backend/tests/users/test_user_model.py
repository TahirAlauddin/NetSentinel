"""
Tests for User model and related functionality.
"""

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType

from tests.rbac_helpers import grant_user_permission_through_bundle
from users.models import ExtendedGroup, PermissionBundle


@pytest.mark.django_db
class TestUserModel:
    """Test cases for User model."""

    def test_user_creation(self, user):
        """Test that a user can be created with required fields."""
        assert user.username == "testuser"
        assert user.email == "testuser@example.com"
        assert user.check_password("testpass123")
        assert user.is_active is True
        assert user.is_staff is False
        assert user.is_superuser is False

    def test_user_str_representation(self, user):
        """Test user string representation."""
        expected = f"{user.first_name} {user.last_name} ({user.email})"
        assert str(user) == expected

    def test_user_get_full_name(self, user):
        """Test get_full_name method."""
        assert user.get_full_name() == "Test User"

    def test_user_get_short_name(self, user):
        """Test get_short_name method."""
        assert user.get_short_name() == "Test"

    def test_superuser_has_arbitrary_perm(self, admin_user):
        """Superusers pass has_perm for any codename."""
        UserModel = get_user_model()
        ct = ContentType.objects.get_for_model(UserModel)
        assert admin_user.has_perm(f"{ct.app_label}.made_up_perm") is True

    def test_user_has_perm_via_bundle(self, user):
        perm_str = grant_user_permission_through_bundle(user, codename="view_assets_rbac")
        assert user.has_perm(perm_str) is True

    def test_user_does_not_have_permission(self, user):
        UserModel = get_user_model()
        ct = ContentType.objects.get_for_model(UserModel)
        assert user.has_perm(f"{ct.app_label}.nonexistent_permission") is False


@pytest.mark.django_db
class TestPermissionBundle:
    """Test cases for PermissionBundle model."""

    def test_permission_bundle_creation(self):
        bundle = PermissionBundle.objects.create(
            name="Test Bundle",
            code="test_bundle_code",
            app="users",
            description="desc",
        )
        assert bundle.name == "Test Bundle"
        assert bundle.code == "test_bundle_code"
        assert bundle.app == "users"

    def test_permission_bundle_str(self):
        bundle = PermissionBundle.objects.create(name="My Bundle", code="my_bundle")
        assert str(bundle) == "My Bundle"


@pytest.mark.django_db
class TestExtendedGroup:
    """Test cases for ExtendedGroup model."""

    def test_extended_group_links_group_and_bundles(self, user):
        UserModel = get_user_model()
        ct = ContentType.objects.get_for_model(UserModel)
        perm, _ = Permission.objects.get_or_create(
            codename="ext_group_perm",
            content_type=ct,
            defaults={"name": "Can ext group"},
        )
        bundle = PermissionBundle.objects.create(name="B", code="b_ext_group", app="users")
        bundle.permissions.add(perm)
        django_group = Group.objects.create(name="Ext Test Group")
        ext = ExtendedGroup.objects.create(group=django_group)
        ext.bundles.add(bundle)
        user.groups.add(django_group)

        assert ext.group == django_group
        assert bundle in ext.bundles.all()
        assert user.has_perm(f"{ct.app_label}.ext_group_perm") is True
