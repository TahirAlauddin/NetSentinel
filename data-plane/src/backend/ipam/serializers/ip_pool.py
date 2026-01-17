"""
IP Pool serializers for IPAM.
"""

from rest_framework import serializers

from ..models import IPPool
from .subnet import SubnetSerializer


class IPPoolSerializer(serializers.ModelSerializer):
    """Serializer for IPPool model."""

    subnet_detail = SubnetSerializer(source="subnet", read_only=True)
    total_ips = serializers.SerializerMethodField()
    reserved_count = serializers.SerializerMethodField()
    available_count = serializers.SerializerMethodField()
    utilization_percentage = serializers.SerializerMethodField()
    reservation_policy_display = serializers.CharField(
        source="get_reservation_policy_display", read_only=True
    )

    def get_total_ips(self, obj):
        """Return total IPs in pool."""
        return obj.get_total_ips()

    def get_reserved_count(self, obj):
        """Return reserved IP count."""
        return obj.get_reserved_count()

    def get_available_count(self, obj):
        """Return available IP count."""
        return obj.get_available_count()

    def get_utilization_percentage(self, obj):
        """Calculate utilization percentage."""
        total = obj.get_total_ips()
        if total == 0:
            return 0
        used = total - obj.get_available_count() - obj.get_reserved_count()
        return round((used / total) * 100, 2)

    class Meta:
        model = IPPool
        fields = [
            "id",
            "subnet",
            "subnet_detail",
            "name",
            "description",
            "start_ip",
            "end_ip",
            "reservation_policy",
            "reservation_policy_display",
            "reserved_percentage",
            "reserved_count",
            "is_active",
            "total_ips",
            "reserved_count",
            "available_count",
            "utilization_percentage",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "total_ips",
            "reserved_count",
            "available_count",
            "utilization_percentage",
            "created_at",
            "updated_at",
        ]


class IPPoolCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating IP pools."""

    class Meta:
        model = IPPool
        fields = [
            "subnet",
            "name",
            "description",
            "start_ip",
            "end_ip",
            "reservation_policy",
            "reserved_percentage",
            "reserved_count",
            "is_active",
        ]

    def validate(self, data):
        """Validate pool configuration."""
        start_ip = data.get("start_ip")
        end_ip = data.get("end_ip")
        reserved_percentage = data.get("reserved_percentage", 0)
        reserved_count = data.get("reserved_count", 0)
        reservation_policy = data.get("reservation_policy", "none")

        if start_ip and end_ip:
            import ipaddress

            try:
                start = ipaddress.ip_address(start_ip)
                end = ipaddress.ip_address(end_ip)

                if start.version != end.version:
                    raise serializers.ValidationError(
                        "Start and end IP addresses must be the same version"
                    )

                if int(end) < int(start):
                    raise serializers.ValidationError(
                        "Start IP must be less than or equal to end IP"
                    )
            except ValueError as e:
                raise serializers.ValidationError(f"Invalid IP address: {str(e)}")

        if reservation_policy == "percentage" and (
            reserved_percentage < 0 or reserved_percentage > 100
        ):
            raise serializers.ValidationError("Reserved percentage must be between 0 and 100")

        if reservation_policy == "fixed" and reserved_count < 0:
            raise serializers.ValidationError("Reserved count must be non-negative")

        return data
