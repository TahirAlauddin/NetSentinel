"""
Tests for User serializers.
"""

import pytest
from rest_framework.exceptions import ValidationError
from django.contrib.auth.models import Group, Permission
from users.models import User, AppPermission, AppPermissionGroup
from users.serializers import (
    UserSerializer,
    UserCreateSerializer,
    GroupSerializer,
    PermissionSerializer,
    AppPermissionSerializer,
    AppPermissionGroupSerializer,
    GroupWithAppPermissionsSerializer,
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
        assert "permissions_detail" in data
        assert "user_count" in data
        assert data["user_count"] == 0

    def test_group_serializer_user_count(self, user):
        """Test that user_count correctly counts group members."""
        group = Group.objects.create(name="Test Group")
        user.groups.add(group)

        serializer = GroupSerializer(group)
        data = serializer.data
        assert data["user_count"] == 1

    def test_group_serializer_permissions_detail(self):
        """Test that permissions_detail provides detailed permission info."""
        group = Group.objects.create(name="Test Group")
        permission = Permission.objects.first()
        if permission:
            group.permissions.add(permission)

        serializer = GroupSerializer(group)
        data = serializer.data
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
class TestAppPermissionSerializer:
    """Test cases for AppPermissionSerializer."""

    def test_app_permission_serializer_serialization(self):
        """Test that AppPermissionSerializer correctly serializes an app permission."""
        permission = AppPermission.objects.create(
            codename="test_permission",
            name="Test Permission",
            category="test",
        )
        serializer = AppPermissionSerializer(permission)
        data = serializer.data

        assert data["id"] == permission.id
        assert data["codename"] == "test_permission"
        assert data["name"] == "Test Permission"
        assert data["category"] == "test"
        assert data["is_active"] is True
        assert "created_at" in data
        assert "updated_at" in data

    def test_app_permission_serializer_create(self):
        """Test creating an app permission via serializer."""
        data = {
            "codename": "new_permission",
            "name": "New Permission",
            "category": "test",
            "description": "A test permission",
        }
        serializer = AppPermissionSerializer(data=data)
        assert serializer.is_valid()
        permission = serializer.save()
        assert permission.codename == "new_permission"
        assert permission.name == "New Permission"

    def test_app_permission_serializer_read_only_fields(self):
        """Test that read-only fields cannot be set."""
        permission = AppPermission.objects.create(
            codename="test_permission",
            name="Test Permission",
            category="test",
        )
        serializer = AppPermissionSerializer(
            permission, data={"id": 999, "created_at": "2020-01-01"}
        )
        serializer.is_valid()
        # Read-only fields should be ignored
        assert serializer.validated_data.get("id") is None


@pytest.mark.django_db
class TestAppPermissionGroupSerializer:
    """Test cases for AppPermissionGroupSerializer."""

    def test_app_permission_group_serializer_serialization(self, user):
        """Test that AppPermissionGroupSerializer correctly serializes."""
        group = Group.objects.create(name="Test Group")
        permission = AppPermission.objects.create(
            codename="test_permission",
            name="Test Permission",
            category="test",
        )
        perm_group = AppPermissionGroup.objects.create(
            group=group,
            permission=permission,
            granted_by=user,
        )

        serializer = AppPermissionGroupSerializer(perm_group)
        data = serializer.data

        assert data["id"] == perm_group.id
        assert data["group"] == group.id
        assert data["group_name"] == group.name
        assert data["permission"] == permission.id
        assert "permission_detail" in data
        assert "granted_at" in data
        assert data["granted_by"] == user.id

    def test_app_permission_group_serializer_permission_detail(self, user):
        """Test that permission_detail provides detailed permission info."""
        group = Group.objects.create(name="Test Group")
        permission = AppPermission.objects.create(
            codename="test_permission",
            name="Test Permission",
            category="test",
        )
        perm_group = AppPermissionGroup.objects.create(
            group=group,
            permission=permission,
            granted_by=user,
        )

        serializer = AppPermissionGroupSerializer(perm_group)
        data = serializer.data
        assert isinstance(data["permission_detail"], dict)
        assert data["permission_detail"]["codename"] == "test_permission"


@pytest.mark.django_db
class TestGroupWithAppPermissionsSerializer:
    """Test cases for GroupWithAppPermissionsSerializer."""

    def test_group_with_app_permissions_serializer_serialization(self, user):
        """Test serialization of group with app permissions."""
        group = Group.objects.create(name="Test Group")
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
        AppPermissionGroup.objects.create(
            group=group,
            permission=permission1,
            granted_by=user,
        )
        AppPermissionGroup.objects.create(
            group=group,
            permission=permission2,
            granted_by=user,
        )

        serializer = GroupWithAppPermissionsSerializer(group)
        data = serializer.data

        assert data["name"] == group.name
        assert "app_permissions" in data
        assert "app_permissions_detail" in data
        assert len(data["app_permissions_detail"]) == 2
        # Verify the permission details are correctly serialized
        permission_codenames = [p["codename"] for p in data["app_permissions_detail"]]
        assert "permission1" in permission_codenames
        assert "permission2" in permission_codenames

    def test_group_with_app_permissions_serializer_create(self, user):
        """Test creating a group with app permissions."""
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

        data = {
            "name": "New Group",
            "app_permissions_write": [permission1.id, permission2.id],
        }

        # Create a mock request context
        from rest_framework.test import APIRequestFactory

        factory = APIRequestFactory()
        request = factory.get("/")
        request.user = user

        serializer = GroupWithAppPermissionsSerializer(
            data=data, context={"request": request}
        )
        assert serializer.is_valid()
        group = serializer.save()
        assert group.name == "New Group"
        assert group.app_permissions.count() == 2

    def test_group_with_app_permissions_serializer_update(self, user):
        """Test updating a group with app permissions."""
        group = Group.objects.create(name="Old Group")
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

        # Add initial permission
        AppPermissionGroup.objects.create(
            group=group,
            permission=permission1,
            granted_by=user,
        )

        # Update with new permissions
        from rest_framework.test import APIRequestFactory

        factory = APIRequestFactory()
        request = factory.get("/")
        request.user = user

        data = {
            "name": "Updated Group",
            "app_permissions_write": [permission2.id],
        }

        serializer = GroupWithAppPermissionsSerializer(
            group, data=data, context={"request": request}
        )
        assert serializer.is_valid()
        updated_group = serializer.save()
        assert updated_group.name == "Updated Group"
        # Old permission should be removed, new one added
        assert updated_group.app_permissions.count() == 1
        # app_permissions returns AppPermissionGroup objects, check the permission attribute
        permission_ids = [
            apg.permission.id for apg in updated_group.app_permissions.all()
        ]
        assert permission2.id in permission_ids
        assert permission1.id not in permission_ids

    def test_group_with_app_permissions_serializer_update_no_permissions(self, user):
        """Test updating a group without changing permissions."""
        group = Group.objects.create(name="Test Group")
        permission = AppPermission.objects.create(
            codename="permission1",
            name="Permission 1",
            category="test",
        )
        AppPermissionGroup.objects.create(
            group=group,
            permission=permission,
            granted_by=user,
        )

        from rest_framework.test import APIRequestFactory

        factory = APIRequestFactory()
        request = factory.get("/")
        request.user = user

        data = {"name": "Updated Name"}

        serializer = GroupWithAppPermissionsSerializer(
            group, data=data, context={"request": request}
        )
        assert serializer.is_valid()
        updated_group = serializer.save()
        assert updated_group.name == "Updated Name"
        # Permissions should remain unchanged
        assert updated_group.app_permissions.count() == 1
