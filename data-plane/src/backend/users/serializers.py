from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model - used for user details and updates.
    """

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "department",
            "position",
            "is_active",
            "is_staff",
            "is_superuser",
            "created_at",
            "updated_at",
            "last_login",
        ]
        read_only_fields = [
            "id",
            "is_staff",
            "is_superuser",
            "created_at",
            "updated_at",
            "last_login",
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new users via Djoser.
    """

    password = serializers.CharField(write_only=True, validators=[validate_password])
    re_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "department",
            "position",
            "password",
            "re_password",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["re_password"]:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs

    def create(self, validated_data):
        validated_data.pop("re_password")
        user = User.objects.create_user(**validated_data)
        return user
