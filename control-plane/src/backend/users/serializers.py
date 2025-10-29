from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Company


class CompanySerializer(serializers.ModelSerializer):
    """
    Serializer for Company model.
    """

    class Meta:
        model = Company
        fields = ["id", "name", "size", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model - used for user details and updates.
    """

    company = CompanySerializer(read_only=True)
    company_id = serializers.UUIDField(source="company.id", read_only=True)

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
            "company",
            "company_id",
            "is_company_admin",
            "is_active",
            "is_staff",
            "is_superuser",
            "created_at",
            "updated_at",
            "last_login",
        ]
        read_only_fields = [
            "id",
            "company",
            "company_id",
            "is_staff",
            "is_superuser",
            "created_at",
            "updated_at",
            "last_login",
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new users via Djoser.
    Creates both the user and their company (tenant) during signup.
    """

    password = serializers.CharField(write_only=True, validators=[validate_password])
    re_password = serializers.CharField(write_only=True)
    company_name = serializers.CharField(write_only=True, max_length=255)
    company_size = serializers.ChoiceField(
        write_only=True,
        choices=[
            ("1-10", "1-10 employees"),
            ("11-50", "11-50 employees"),
            ("51-200", "51-200 employees"),
            ("201-500", "201-500 employees"),
            ("501+", "501+ employees"),
        ],
    )
    phone_number = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=15
    )
    department = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=100
    )
    position = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=100
    )

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
            "company_name",
            "company_size",
        ]

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("re_password"):
            raise serializers.ValidationError({"re_password": "Passwords don't match."})

        # Convert empty strings to None for optional fields
        for field in ["phone_number", "department", "position"]:
            if field in attrs and attrs[field] == "":
                attrs[field] = None

        # Check if company name already exists
        company_name = attrs.get("company_name")
        if company_name and Company.objects.filter(name=company_name).exists():
            raise serializers.ValidationError(
                {"company_name": "A company with this name already exists."}
            )

        # Check if username already exists
        username = attrs.get("username")
        if username and User.objects.filter(username=username).exists():
            raise serializers.ValidationError(
                {"username": "A user with that username already exists."}
            )

        # Check if email already exists
        email = attrs.get("email")
        if email and User.objects.filter(email=email).exists():
            raise serializers.ValidationError(
                {"email": "A user with that email already exists."}
            )

        return attrs

    def create(self, validated_data):
        # Extract company data
        company_name = validated_data.pop("company_name")
        company_size = validated_data.pop("company_size")
        validated_data.pop("re_password")

        # Create company first
        company = Company.objects.create(name=company_name, size=company_size)

        # Create user and associate with company
        user = User.objects.create_user(
            **validated_data,
            company=company,
            is_company_admin=True,  # First user is the company admin
        )

        return user
