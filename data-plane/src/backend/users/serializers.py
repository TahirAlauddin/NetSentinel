from django.contrib.auth.models import Group, Permission
from rest_framework import serializers

from .models import User


class PermissionSerializer(serializers.ModelSerializer):
    """Serializer for Permission."""

    content_type = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Permission
        fields = ["id", "name", "codename", "content_type"]
        read_only_fields = ["id", "content_type"]


class GroupSerializer(serializers.ModelSerializer):
    """Serializer for Group."""

    permissions_detail = PermissionSerializer(source="permissions", many=True, read_only=True)
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
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("re_password")
        password = validated_data.pop("password")
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user

