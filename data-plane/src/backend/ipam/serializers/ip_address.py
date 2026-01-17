"""
IP Address serializer for IPAM.

This module provides serialization for individual IP address models.
"""

from rest_framework import serializers

from ..models import IPAddress
from .subnet import SubnetSerializer
from .ip_tag import IPTagSerializer


class IPAddressSerializer(serializers.ModelSerializer):
    """
    Serializer for IPAddress model.

    Serializes individual IP address information with subnet details.
    Supports both IPv4 and IPv6 addresses.
    Includes asset assignment information.
    """

    subnet_detail = SubnetSerializer(source="subnet", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    assigned_to_asset_detail = serializers.SerializerMethodField()
    assigned_by_detail = serializers.SerializerMethodField()
    tags_detail = IPTagSerializer(source="tags", many=True, read_only=True)

    def get_assigned_to_asset_detail(self, obj):
        """Return asset details if assigned."""
        if obj.assigned_to_asset:
            return {
                "id": obj.assigned_to_asset.id,
                "name": obj.assigned_to_asset.name,
                "asset_tag": obj.assigned_to_asset.asset_tag,
            }
        return None

    def get_assigned_by_detail(self, obj):
        """Return user details if assigned by someone."""
        if obj.assigned_by:
            return {
                "id": obj.assigned_by.id,
                "username": obj.assigned_by.username,
                "email": obj.assigned_by.email,
                "full_name": obj.assigned_by.get_full_name(),
            }
        return None

    def __init__(self, *args, **kwargs):
        """Initialize serializer and add tag_ids field for writing."""
        super().__init__(*args, **kwargs)
        # Add tag_ids as a write-only field for create/update operations
        from ..models import IPTag
        self.fields["tag_ids"] = serializers.PrimaryKeyRelatedField(
            many=True,
            queryset=IPTag.objects.filter(is_active=True),
            write_only=True,
            required=False,
            allow_null=True,
        )

    def create(self, validated_data):
        """Create IP address and handle tags."""
        tag_ids = validated_data.pop("tag_ids", None)
        instance = super().create(validated_data)
        if tag_ids:
            instance.tags.set(tag_ids)
        return instance

    def update(self, instance, validated_data):
        """Update IP address and handle tags."""
        tag_ids = validated_data.pop("tag_ids", None)
        instance = super().update(instance, validated_data)
        if tag_ids is not None:
            instance.tags.set(tag_ids)
        return instance

    class Meta:
        model = IPAddress
        fields = [
            "id",
            "address",
            "subnet",
            "subnet_detail",
            "status",
            "status_display",
            "description",
            "assigned_to_asset",
            "assigned_to_asset_detail",
            "assigned_by",
            "assigned_by_detail",
            "assigned_at",
            "tags",
            "tags_detail",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "assigned_by",
            "assigned_at",
            "created_at",
            "updated_at",
        ]
