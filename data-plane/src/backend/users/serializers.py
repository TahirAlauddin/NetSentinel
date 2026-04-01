from django.contrib.auth.models import Group, Permission
from rest_framework import serializers

from .models import ExtendedGroup, PermissionBundle, User


class PermissionSerializer(serializers.ModelSerializer):
    """Serializer for Permission."""

    content_type = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Permission
        fields = ["id", "name", "codename", "content_type"]
        read_only_fields = ["id", "content_type"]


class GroupSerializer(serializers.ModelSerializer):
    """Lightweight serializer for Group list responses (no permissions_detail)."""

    permissions = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Permission.objects.all(), required=False
    )
    user_count = serializers.SerializerMethodField()
    permission_bundle_ids = serializers.SerializerMethodField()
    app_level_permission_count = serializers.SerializerMethodField()

    def get_user_count(self, obj):
        return obj.user_set.count()

    def get_permission_bundle_ids(self, obj):
        try:
            ext = obj.extended
            return list(ext.bundles.values_list("id", flat=True))
        except ExtendedGroup.DoesNotExist:
            return []

    def get_app_level_permission_count(self, obj):
        """Return unique app count as shown in UI tabs/cards."""
        try:
            app_labels = list(obj.extended.bundles.values_list("app", flat=True))
        except ExtendedGroup.DoesNotExist:
            return 0

        ui_apps = set()
        for label in app_labels:
            if not label:
                continue
            if label == "phone_management":
                ui_apps.add("phone_mgmt")
            elif label in {
                "users",
                "infrastructure",
                "notifications",
                "auth",
                "admin",
                "contenttypes",
                "sessions",
            }:
                ui_apps.add("users")
            else:
                ui_apps.add(label)
        return len(ui_apps)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._bundle_ids_to_set = None

    def validate(self, attrs):
        attrs = super().validate(attrs)
        request = self.context.get("request")
        self._bundle_ids_to_set = None
        if request and hasattr(request, "data") and "permission_bundle_ids" in request.data:
            raw = request.data.get("permission_bundle_ids")
            if raw is None:
                raw = []
            if not isinstance(raw, list):
                raise serializers.ValidationError(
                    {"permission_bundle_ids": "Expected a list of bundle IDs."}
                )
            bundle_ids = []
            for x in raw:
                try:
                    bid = int(x)
                except (TypeError, ValueError):
                    raise serializers.ValidationError(
                        {"permission_bundle_ids": "Each bundle id must be an integer."}
                    )
                if bid < 1:
                    raise serializers.ValidationError(
                        {"permission_bundle_ids": "Each bundle id must be a positive integer."}
                    )
                bundle_ids.append(bid)
            self._bundle_ids_to_set = bundle_ids
        return attrs

    def create(self, validated_data):
        group = super().create(validated_data)
        if self._bundle_ids_to_set is not None:
            ext, _ = ExtendedGroup.objects.get_or_create(group=group)
            ext.bundles.set(PermissionBundle.objects.filter(id__in=self._bundle_ids_to_set))
        return group

    def update(self, instance, validated_data):
        group = super().update(instance, validated_data)
        if self._bundle_ids_to_set is not None:
            ext, _ = ExtendedGroup.objects.get_or_create(group=group)
            ext.bundles.set(PermissionBundle.objects.filter(id__in=self._bundle_ids_to_set))
        return group

    class Meta:
        model = Group
        fields = [
            "id",
            "name",
            "permissions",
            "user_count",
            "permission_bundle_ids",
            "app_level_permission_count",
        ]
        read_only_fields = ["id"]


class GroupDetailSerializer(GroupSerializer):
    """Full serializer for single-group retrieval — includes permissions_detail."""

    permissions_detail = PermissionSerializer(source="permissions", many=True, read_only=True)

    class Meta(GroupSerializer.Meta):
        fields = GroupSerializer.Meta.fields + ["permissions_detail"]


class PermissionBundleSerializer(serializers.ModelSerializer):
    """Lightweight serializer for PermissionBundle list responses (no permissions_detail)."""

    permissions = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Permission.objects.all(), required=False
    )

    class Meta:
        model = PermissionBundle
        fields = [
            "id",
            "name",
            "code",
            "app",
            "description",
            "permissions",
        ]
        read_only_fields = ["id"]


class PermissionBundleDetailSerializer(PermissionBundleSerializer):
    """Full serializer for single-bundle retrieval — includes permissions_detail."""

    permissions_detail = PermissionSerializer(source="permissions", many=True, read_only=True)

    class Meta(PermissionBundleSerializer.Meta):
        fields = PermissionBundleSerializer.Meta.fields + ["permissions_detail"]


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


class UserAssignmentsUpdateSerializer(serializers.Serializer):
    """
    Assign groups and direct Django permissions to a user.
    Effective permissions are derived from:
      - user.user_permissions (direct grants)
      - user.groups -> ExtendedGroup -> PermissionBundle -> permissions
    """

    group_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=True,
        allow_empty=True,
    )
    permission_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        required=True,
        allow_empty=True,
    )

