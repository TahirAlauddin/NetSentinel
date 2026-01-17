"""
IP Assignment History serializer for IPAM.

This module provides serialization for IP address assignment history records.
"""

from rest_framework import serializers

from ..models import IPAssignmentHistory


class IPAssignmentHistorySerializer(serializers.ModelSerializer):
    """
    Serializer for IPAssignmentHistory model.

    Serializes IP address assignment history with nested details.
    """

    ip_address_detail = serializers.SerializerMethodField()
    assigned_to_asset_detail = serializers.SerializerMethodField()
    previous_asset_detail = serializers.SerializerMethodField()
    performed_by_detail = serializers.SerializerMethodField()
    action_display = serializers.CharField(source="get_action_display", read_only=True)

    def get_ip_address_detail(self, obj):
        """Return IP address details."""
        if obj.ip_address:
            return {
                "id": obj.ip_address.id,
                "address": obj.ip_address.address,
                "status": obj.ip_address.status,
                "status_display": obj.ip_address.get_status_display(),
            }
        return None

    def get_assigned_to_asset_detail(self, obj):
        """Return asset details if assigned."""
        if obj.assigned_to_asset:
            return {
                "id": obj.assigned_to_asset.id,
                "name": obj.assigned_to_asset.name,
                "asset_tag": obj.assigned_to_asset.asset_tag,
            }
        return None

    def get_previous_asset_detail(self, obj):
        """Return previous asset details if exists."""
        if obj.previous_asset:
            return {
                "id": obj.previous_asset.id,
                "name": obj.previous_asset.name,
                "asset_tag": obj.previous_asset.asset_tag,
            }
        return None

    def get_performed_by_detail(self, obj):
        """Return user details if performed by someone."""
        if obj.performed_by:
            return {
                "id": obj.performed_by.id,
                "username": obj.performed_by.username,
                "email": obj.performed_by.email,
                "full_name": obj.performed_by.get_full_name(),
            }
        return None

    class Meta:
        model = IPAssignmentHistory
        fields = [
            "id",
            "ip_address",
            "ip_address_detail",
            "action",
            "action_display",
            "assigned_to_asset",
            "assigned_to_asset_detail",
            "previous_asset",
            "previous_asset_detail",
            "previous_status",
            "new_status",
            "performed_by",
            "performed_by_detail",
            "reason",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
