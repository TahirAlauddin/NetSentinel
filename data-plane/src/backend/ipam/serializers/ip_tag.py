"""
IP Tag serializers for IPAM.
"""

from rest_framework import serializers

from ..models import IPTag, IPAddressTag, IPAddress


class IPTagSerializer(serializers.ModelSerializer):
    """Serializer for IPTag model."""

    usage_count = serializers.SerializerMethodField()
    color_display = serializers.CharField(source="get_color_display", read_only=True)

    def get_usage_count(self, obj):
        """Return count of IP addresses using this tag."""
        return obj.get_usage_count()

    class Meta:
        model = IPTag
        fields = [
            "id",
            "name",
            "description",
            "color",
            "color_display",
            "is_active",
            "usage_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "usage_count"]


class IPTagCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating IPTag."""

    class Meta:
        model = IPTag
        fields = [
            "name",
            "description",
            "color",
            "is_active",
        ]

    def validate_name(self, value):
        """Validate tag name format."""
        if not value:
            raise serializers.ValidationError("Tag name cannot be empty")
        # Name validation is handled by model validators
        return value.lower().strip()


class IPAddressTagSerializer(serializers.ModelSerializer):
    """Serializer for IPAddressTag relationship."""

    tag_detail = IPTagSerializer(source="tag", read_only=True)
    ip_address_detail = serializers.SerializerMethodField()
    applied_by_username = serializers.CharField(
        source="applied_by.username", read_only=True
    )

    def get_ip_address_detail(self, obj):
        """Return basic IP address info."""
        return {
            "id": obj.ip_address.id,
            "address": obj.ip_address.address,
            "status": obj.ip_address.status,
        }

    class Meta:
        model = IPAddressTag
        fields = [
            "id",
            "ip_address",
            "ip_address_detail",
            "tag",
            "tag_detail",
            "applied_by",
            "applied_by_username",
            "applied_at",
            "notes",
        ]
        read_only_fields = [
            "id",
            "applied_by",
            "applied_at",
        ]


class IPAddressTagCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating IPAddressTag relationship."""

    class Meta:
        model = IPAddressTag
        fields = [
            "ip_address",
            "tag",
            "notes",
        ]

    def validate(self, data):
        """Validate that IP address and tag combination is unique."""
        ip_address = data.get("ip_address")
        tag = data.get("tag")

        if ip_address and tag:
            if IPAddressTag.objects.filter(
                ip_address=ip_address, tag=tag
            ).exists():
                raise serializers.ValidationError(
                    f"Tag '{tag.name}' is already applied to IP address {ip_address.address}"
                )

        return data


class IPAddressWithTagsSerializer(serializers.ModelSerializer):
    """Extended IPAddress serializer that includes tags."""

    tags_detail = IPTagSerializer(source="tags", many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=IPTag.objects.filter(is_active=True),
        source="tags",
        write_only=True,
        required=False,
    )

    class Meta:
        model = IPAddress
        fields = [
            "id",
            "address",
            "subnet",
            "status",
            "description",
            "tags",
            "tags_detail",
            "tag_ids",
            "assigned_to_asset",
            "assigned_by",
            "assigned_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]
