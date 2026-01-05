"""
Tests for User model and related functionality.
"""

import pytest
from django.contrib.auth.models import Group
from users.models import AppPermission, AppPermissionGroup


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

    def test_superuser_has_all_permissions(self, admin_user):
        """Test that superuser has all app permissions."""
        AppPermission.objects.create(
            codename="test_permission",
            name="Test Permission",
            category="test",
        )
        assert admin_user.has_app_permission("test_permission") is True

    def test_user_has_app_permission_direct(self, user):
        """Test user has direct app permission."""
        permission = AppPermission.objects.create(
            codename="view_assets",
            name="View Assets",
            category="assets",
        )
        user.app_permissions.add(permission)
        assert user.has_app_permission("view_assets") is True

    def test_user_has_app_permission_via_group(self, user):
        """Test user has app permission through group."""
        permission = AppPermission.objects.create(
            codename="create_assets",
            name="Create Assets",
            category="assets",
        )
        group = Group.objects.create(name="Asset Managers")
        user.groups.add(group)
        AppPermissionGroup.objects.create(group=group, permission=permission)
        assert user.has_app_permission("create_assets") is True

    def test_user_does_not_have_permission(self, user):
        """Test user does not have a permission they weren't granted."""
        assert user.has_app_permission("nonexistent_permission") is False

    def test_user_has_any_app_permission(self, user):
        """Test has_any_app_permission method."""
        permission1 = AppPermission.objects.create(
            codename="permission1",
            name="Permission 1",
            category="test",
        )
        user.app_permissions.add(permission1)
        assert user.has_any_app_permission(["permission1", "permission2"]) is True
        assert user.has_any_app_permission(["permission2", "permission3"]) is False

    def test_user_has_all_app_permissions(self, user):
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

    def test_user_get_app_permissions(self, user):
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
        user.app_permissions.add(permission1, permission2)
        permissions = user.get_app_permissions()
        assert permissions.count() == 2
        assert permission1 in permissions
        assert permission2 in permissions

    def test_inactive_permission_not_returned(self, user):
        """Test that inactive permissions are not returned."""
        permission = AppPermission.objects.create(
            codename="inactive_permission",
            name="Inactive Permission",
            category="test",
            is_active=False,
        )
        user.app_permissions.add(permission)
        assert user.has_app_permission("inactive_permission") is False
        assert permission not in user.get_app_permissions()


@pytest.mark.django_db
class TestAppPermission:
    """Test cases for AppPermission model."""

    def test_app_permission_creation(self):
        """Test that an app permission can be created."""
        permission = AppPermission.objects.create(
            codename="test_permission",
            name="Test Permission",
            description="A test permission",
            category="test",
            app_label="test_app",
        )
        assert permission.codename == "test_permission"
        assert permission.name == "Test Permission"
        assert permission.is_active is True

    def test_app_permission_str_representation(self):
        """Test app permission string representation."""
        permission = AppPermission.objects.create(
            codename="test_permission",
            name="Test Permission",
        )
        assert str(permission) == "Test Permission (test_permission)"


@pytest.mark.django_db
class TestAppPermissionGroup:
    """Test cases for AppPermissionGroup model."""

    def test_app_permission_group_creation(self, user):
        """Test that an app permission group can be created."""
        permission = AppPermission.objects.create(
            codename="test_permission",
            name="Test Permission",
        )
        group = Group.objects.create(name="Test Group")
        perm_group = AppPermissionGroup.objects.create(
            group=group,
            permission=permission,
            granted_by=user,
        )
        assert perm_group.group == group
        assert perm_group.permission == permission
        assert perm_group.granted_by == user
