"""
DHCP serializers for IPAM.
"""

from rest_framework import serializers

from ..models import DHCPScope, DHCPLease, DHCPReservation
from .subnet import SubnetSerializer


class DHCPReservationSerializer(serializers.ModelSerializer):
    """Serializer for DHCPReservation model."""

    class Meta:
        model = DHCPReservation
        fields = [
            "id",
            "scope",
            "ip_address",
            "mac_address",
            "hostname",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class DHCPLeaseSerializer(serializers.ModelSerializer):
    """Serializer for DHCPLease model."""

    scope_detail = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    is_expired = serializers.SerializerMethodField()
    time_remaining = serializers.SerializerMethodField()

    def get_scope_detail(self, obj):
        """Return scope summary."""
        if obj.scope:
            return {
                "id": obj.scope.id,
                "name": obj.scope.name,
                "subnet": obj.scope.subnet.network if obj.scope.subnet else None,
            }
        return None

    def get_is_expired(self, obj):
        """Return if lease is expired."""
        return obj.is_expired

    def get_time_remaining(self, obj):
        """Return time remaining in seconds."""
        return obj.time_remaining

    class Meta:
        model = DHCPLease
        fields = [
            "id",
            "scope",
            "scope_detail",
            "ip_address",
            "mac_address",
            "hostname",
            "status",
            "status_display",
            "lease_start",
            "lease_end",
            "lease_renewal",
            "client_identifier",
            "vendor_class",
            "notes",
            "is_expired",
            "time_remaining",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "is_expired",
            "time_remaining",
            "created_at",
            "updated_at",
        ]


class DHCPScopeSerializer(serializers.ModelSerializer):
    """Serializer for DHCPScope model."""

    subnet_detail = SubnetSerializer(source="subnet", read_only=True)
    active_leases_count = serializers.SerializerMethodField()
    reservations_count = serializers.SerializerMethodField()
    available_ips = serializers.SerializerMethodField()

    def get_active_leases_count(self, obj):
        """Return count of active leases."""
        return obj.leases.filter(status="active").count()

    def get_reservations_count(self, obj):
        """Return count of active reservations."""
        return obj.reservations.filter(is_active=True).count()

    def get_available_ips(self, obj):
        """Return count of available IPs."""
        return obj.get_available_ips()

    class Meta:
        model = DHCPScope
        fields = [
            "id",
            "subnet",
            "subnet_detail",
            "name",
            "description",
            "start_ip",
            "end_ip",
            "subnet_mask",
            "gateway",
            "dns_servers",
            "lease_duration",
            "max_leases",
            "is_active",
            "active_leases_count",
            "reservations_count",
            "available_ips",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "active_leases_count",
            "reservations_count",
            "available_ips",
            "created_at",
            "updated_at",
        ]


class DHCPScopeCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating DHCP scopes."""

    class Meta:
        model = DHCPScope
        fields = [
            "subnet",
            "name",
            "description",
            "start_ip",
            "end_ip",
            "subnet_mask",
            "gateway",
            "dns_servers",
            "lease_duration",
            "max_leases",
            "is_active",
        ]

    def validate(self, data):
        """Validate that start_ip is less than or equal to end_ip."""
        start_ip = data.get("start_ip")
        end_ip = data.get("end_ip")

        if start_ip and end_ip:
            import ipaddress

            try:
                start = ipaddress.ip_address(start_ip)
                end = ipaddress.ip_address(end_ip)

                if start.version != end.version:
                    raise serializers.ValidationError(
                        "Start and end IP addresses must be the same version (IPv4 or IPv6)"
                    )

                if int(end) < int(start):
                    raise serializers.ValidationError(
                        "Start IP must be less than or equal to end IP"
                    )
            except ValueError as e:
                raise serializers.ValidationError(f"Invalid IP address: {str(e)}")

        return data


class DHCPLeaseCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating DHCP leases."""

    lease_duration = serializers.IntegerField(required=False, default=86400, write_only=True)

    class Meta:
        model = DHCPLease
        fields = [
            "scope",
            "ip_address",
            "mac_address",
            "hostname",
            "lease_duration",
        ]

    def create(self, validated_data):
        """Create a new DHCP lease with calculated timestamps."""
        from ..services.dhcp import create_lease

        lease_duration = validated_data.pop("lease_duration", None)
        scope = validated_data["scope"]
        ip_address = validated_data["ip_address"]
        mac_address = validated_data["mac_address"]
        hostname = validated_data.get("hostname")

        # Use the service function to create the lease
        # This handles lease renewal logic and timestamp calculation
        return create_lease(
            scope_id=scope.id,
            ip_address=ip_address,
            mac_address=mac_address,
            hostname=hostname,
            lease_duration=lease_duration,
        )
