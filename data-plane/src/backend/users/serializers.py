from rest_framework import serializers
from django.contrib.auth.models import Group, Permission
from .models import User, AppPermission, AppPermissionGroup


class PermissionSerializer(serializers.ModelSerializer):
    """Serializer for Permission."""

    content_type = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Permission
        fields = ["id", "name", "codename", "content_type"]
        read_only_fields = ["id", "content_type"]


class GroupSerializer(serializers.ModelSerializer):
    """Serializer for Group."""

    permissions_detail = PermissionSerializer(
        source="permissions", many=True, read_only=True
    )
    permissions = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Permission.objects.all(), required=False
    )
    user_count = serializers.SerializerMethodField()

    def get_user_count(self, obj):
        return obj.user_set.count()

    class Meta:
        model = Group
        fields = [
            "id",
            "name",
            "permissions",
            "permissions_detail",
            "user_count",
        ]
        read_only_fields = ["id"]


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User."""

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_staff",
            "is_superuser",
            "is_active",
            "date_joined",
            "last_login",
        ]
        read_only_fields = [
            "id",
            "date_joined",
            "last_login",
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new user."""

    password = serializers.CharField(write_only=True, required=True)
    re_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "re_password",
            "first_name",
            "last_name",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["re_password"]:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("re_password")
        password = validated_data.pop("password")
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user


class AppPermissionSerializer(serializers.ModelSerializer):
    """Serializer for App Permission."""

    class Meta:
        model = AppPermission
        fields = [
            "id",
            "codename",
            "name",
            "description",
            "app_label",
            "category",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class AppPermissionGroupSerializer(serializers.ModelSerializer):
    """Serializer for Group App Permission."""

    permission_detail = AppPermissionSerializer(source="permission", read_only=True)
    group_name = serializers.CharField(source="group.name", read_only=True)

    class Meta:
        model = AppPermissionGroup
        fields = [
            "id",
            "group",
            "group_name",
            "permission",
            "permission_detail",
            "granted_at",
            "granted_by",
        ]
        read_only_fields = ["id", "granted_at"]



class GroupWithAppPermissionsSerializer(GroupSerializer):
    """Extended Group serializer with app permissions."""

    app_permissions_detail = AppPermissionSerializer(
        source="app_permissions", many=True, read_only=True
    )
    app_permissions = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=AppPermission.objects.filter(is_active=True),
        required=False,
        write_only=True,
    )

    class Meta(GroupSerializer.Meta):
        fields = GroupSerializer.Meta.fields + [
            "app_permissions",
            "app_permissions_detail",
        ]

    def update(self, instance, validated_data):
        """Update group app permissions."""
        app_permissions = validated_data.pop("app_permissions", None)
        group = super().update(instance, validated_data)

        if app_permissions is not None:
            # Clear existing app permissions
            AppPermissionGroup.objects.filter(group=group).delete()
            # Add new app permissions
            for permission in app_permissions:
                AppPermissionGroup.objects.create(
                    group=group,
                    permission=permission,
                    granted_by=self.context["request"].user,
                )

        return group

    def create(self, validated_data):
        """Create group with app permissions."""
        app_permissions = validated_data.pop("app_permissions", [])
        group = super().create(validated_data)

        # Add app permissions
        for permission in app_permissions:
            AppPermissionGroup.objects.create(
                group=group,
                permission=permission,
                granted_by=self.context["request"].user,
            )

        return group
