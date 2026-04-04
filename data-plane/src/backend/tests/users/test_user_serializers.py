"""
Tests for User serializers.
"""

import pytest
from django.contrib.auth.models import Group, Permission

from users.models import PermissionBundle
from users.serializers import (
    GroupDetailSerializer,
    GroupSerializer,
    PermissionBundleDetailSerializer,
    PermissionBundleSerializer,
    PermissionSerializer,
    UserCreateSerializer,
    UserSerializer,
)


@pytest.mark.django_db
class TestUserSerializer:
    """Test cases for UserSerializer."""

    def test_user_serializer_serialization(self, user):
        """Test that UserSerializer correctly serializes a user."""
        serializer = UserSerializer(user)
        data = serializer.data

        assert data["id"] == user.id
        assert data["username"] == user.username
        assert data["email"] == user.email
        assert data["first_name"] == user.first_name
        assert data["last_name"] == user.last_name
        assert data["is_staff"] == user.is_staff
        assert data["is_superuser"] == user.is_superuser
        assert data["is_active"] == user.is_active
        assert "date_joined" in data
        assert "last_login" in data

    def test_user_serializer_read_only_fields(self, user):
        """Test that read-only fields cannot be updated."""
        serializer = UserSerializer(user, data={"id": 999, "date_joined": "2020-01-01"})
        serializer.is_valid()
        # Read-only fields should be ignored
        assert serializer.validated_data.get("id") is None
        assert serializer.validated_data.get("date_joined") is None

    def test_user_serializer_update(self, user):
        """Test that UserSerializer can update user fields."""
        serializer = UserSerializer(
            user,
            data={
                "username": user.username,
                "email": user.email,
                "first_name": "Updated",
                "last_name": "Name",
            },
        )
        assert serializer.is_valid(), serializer.errors
        updated_user = serializer.save()
        assert updated_user.first_name == "Updated"
        assert updated_user.last_name == "Name"


@pytest.mark.django_db
class TestUserCreateSerializer:
    """Test cases for UserCreateSerializer."""

    def test_user_create_serializer_valid_data(self):
        """Test creating a user with valid data."""
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "securepass123",
            "re_password": "securepass123",
            "first_name": "New",
            "last_name": "User",
        }
        serializer = UserCreateSerializer(data=data)
        assert serializer.is_valid()
        user = serializer.save()
        assert user.username == "newuser"
        assert user.email == "newuser@example.com"
        assert user.check_password("securepass123")
        assert user.first_name == "New"
        assert user.last_name == "User"

    def test_user_create_serializer_password_mismatch(self):
        """Test that password mismatch raises validation error."""
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "securepass123",
            "re_password": "differentpass",
            "first_name": "New",
            "last_name": "User",
        }
        serializer = UserCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert "password" in serializer.errors

    def test_user_create_serializer_password_required(self):
        """Test that password is required."""
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "first_name": "New",
            "last_name": "User",
        }
        serializer = UserCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert "password" in serializer.errors

    def test_user_create_serializer_re_password_required(self):
        """Test that re_password is required."""
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "securepass123",
            "first_name": "New",
            "last_name": "User",
        }
        serializer = UserCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert "re_password" in serializer.errors

    def test_user_create_serializer_password_not_in_output(self):
        """Test that password fields are not in serialized output."""
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "securepass123",
            "re_password": "securepass123",
            "first_name": "New",
            "last_name": "User",
        }
        serializer = UserCreateSerializer(data=data)
        assert serializer.is_valid()
        user = serializer.save()
        output = UserCreateSerializer(user).data
        assert "password" not in output
        assert "re_password" not in output


@pytest.mark.django_db
class TestGroupSerializer:
    """Test cases for GroupSerializer."""

    def test_group_serializer_serialization(self):
        """Test that GroupSerializer correctly serializes a group."""
        group = Group.objects.create(name="Test Group")
        permission = Permission.objects.first()
        if permission:
            group.permissions.add(permission)

        serializer = GroupSerializer(group)
        data = serializer.data

        assert data["id"] == group.id
        assert data["name"] == group.name
        assert "permissions" in data
        assert "permission_bundle_ids" in data
        assert data["permission_bundle_ids"] == []
        assert "app_level_permission_count" in data
        assert data["app_level_permission_count"] == 0
        assert "user_count" in data
        assert data["user_count"] == 0
        assert "permissions_detail" not in data

    def test_group_serializer_user_count(self, user):
        """Test that user_count correctly counts group members."""
        group = Group.objects.create(name="Test Group")
        user.groups.add(group)

        serializer = GroupSerializer(group)
        data = serializer.data
        assert data["user_count"] == 1

    def test_group_detail_serializer_permissions_detail(self):
        """GroupDetailSerializer includes permissions_detail."""
        group = Group.objects.create(name="Test Group")
        permission = Permission.objects.first()
        if permission:
            group.permissions.add(permission)

        serializer = GroupDetailSerializer(group)
        data = serializer.data
        assert "permissions_detail" in data
        assert isinstance(data["permissions_detail"], list)
        if data["permissions_detail"]:
            perm_detail = data["permissions_detail"][0]
            assert "id" in perm_detail
            assert "name" in perm_detail
            assert "codename" in perm_detail

    def test_group_serializer_create_with_permissions(self):
        """Test creating a group with permissions."""
        permission = Permission.objects.first()
        data = {
            "name": "New Group",
            "permissions": [permission.id] if permission else [],
        }
        serializer = GroupSerializer(data=data)
        assert serializer.is_valid()
        group = serializer.save()
        assert group.name == "New Group"
        if permission:
            assert permission in group.permissions.all()

    def test_group_serializer_update(self):
        """Test updating a group."""
        group = Group.objects.create(name="Old Name")
        data = {"name": "New Name"}
        serializer = GroupSerializer(group, data=data)
        assert serializer.is_valid()
        updated_group = serializer.save()
        assert updated_group.name == "New Name"


@pytest.mark.django_db
class TestPermissionSerializer:
    """Test cases for PermissionSerializer."""

    def test_permission_serializer_serialization(self):
        """Test that PermissionSerializer correctly serializes a permission."""
        permission = Permission.objects.first()
        if permission:
            serializer = PermissionSerializer(permission)
            data = serializer.data

            assert data["id"] == permission.id
            assert data["name"] == permission.name
            assert data["codename"] == permission.codename
            assert "content_type" in data

    def test_permission_serializer_read_only_content_type(self):
        """Test that content_type is read-only."""
        permission = Permission.objects.first()
        if permission:
            serializer = PermissionSerializer(permission, data={"content_type": 999})
            serializer.is_valid()
            # content_type should be ignored as it's read-only
            assert serializer.validated_data.get("content_type") is None


@pytest.mark.django_db
class TestPermissionBundleSerializer:
    """Test cases for PermissionBundleSerializer."""

    def test_permission_bundle_serializer_serialization(self):
        bundle = PermissionBundle.objects.create(
            name="Bundle A",
            code="bundle_a",
            app="users",
            description="desc",
        )
        serializer = PermissionBundleSerializer(bundle)
        data = serializer.data
        assert data["id"] == bundle.id
        assert data["name"] == "Bundle A"
        assert data["code"] == "bundle_a"
        assert data["app"] == "users"
        assert data["description"] == "desc"
        assert data["permissions"] == []

    def test_permission_bundle_detail_includes_permissions_detail(self):
        bundle = PermissionBundle.objects.create(name="B", code="b_detail", app="users")
        perm = Permission.objects.first()
        if perm:
            bundle.permissions.add(perm)
        serializer = PermissionBundleDetailSerializer(bundle)
        data = serializer.data
        assert "permissions_detail" in data
        if perm:
            assert len(data["permissions_detail"]) >= 1


@pytest.mark.django_db
class TestGroupSerializerPermissionBundles:
    """GroupSerializer exposes assigned permission bundle ids."""

    def test_group_serializer_permission_bundle_ids(self):
        from users.models import ExtendedGroup

        group = Group.objects.create(name="Bundled Group")
        perm = Permission.objects.first()
        bundle = PermissionBundle.objects.create(
            name="Sub", code="sub_bundle_test", app="users"
        )
        if perm:
            bundle.permissions.add(perm)
        ext, _ = ExtendedGroup.objects.get_or_create(group=group)
        ext.bundles.add(bundle)

        serializer = GroupSerializer(group)
        data = serializer.data
        assert bundle.id in data["permission_bundle_ids"]
