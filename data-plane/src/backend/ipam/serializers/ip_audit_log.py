"""
IP Audit Log serializers for IPAM.
"""

from rest_framework import serializers

from ..models import IPAuditLog, IPAuditLogFilter


class IPAuditLogSerializer(serializers.ModelSerializer):
    """Serializer for IPAuditLog model."""

    action_display = serializers.CharField(source="get_action_display", read_only=True)
    user_display = serializers.SerializerMethodField()
    ip_address_detail = serializers.SerializerMethodField()

    def get_user_display(self, obj):
        """Return user display name."""
        return obj.display_user

    def get_ip_address_detail(self, obj):
        """Return IP address details if available."""
        if obj.ip_address:
            return {
                "id": obj.ip_address.id,
                "address": obj.ip_address.address,
                "status": obj.ip_address.status,
            }
        return {
            "address": obj.ip_address_str,
            "subnet_id": obj.subnet_id,
            "subnet_network": obj.subnet_network,
        }

    class Meta:
        model = IPAuditLog
        fields = [
            "id",
            "ip_address",
            "ip_address_str",
            "ip_address_detail",
            "action",
            "action_display",
            "user",
            "username",
            "user_display",
            "field_name",
            "old_value",
            "new_value",
            "reason",
            "metadata",
            "subnet_id",
            "subnet_network",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
        ]


class IPAuditLogFilterSerializer(serializers.ModelSerializer):
    """Serializer for IPAuditLogFilter model."""

    class Meta:
        model = IPAuditLogFilter
        fields = [
            "id",
            "name",
            "user",
            "filters",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "created_at",
            "updated_at",
        ]
