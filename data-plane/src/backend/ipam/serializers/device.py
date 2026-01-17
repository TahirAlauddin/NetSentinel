"""
Device serializers for IPAM.
"""

from rest_framework import serializers

from ..models import Device, DeviceType, Rack


class DeviceTypeSerializer(serializers.ModelSerializer):
    """Serializer for DeviceType model."""

    class Meta:
        model = DeviceType
        fields = [
            "id",
            "name",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class RackSerializer(serializers.ModelSerializer):
    """Serializer for Rack model."""

    location_detail = serializers.SerializerMethodField()
    devices_count = serializers.SerializerMethodField()

    def get_location_detail(self, obj):
        """Return location summary."""
        if obj.location:
            return {
                "id": obj.location.id,
                "name": obj.location.name,
                "city": obj.location.city,
            }
        return None

    def get_devices_count(self, obj):
        """Return count of devices in this rack."""
        return obj.devices.filter(is_active=True).count()

    class Meta:
        model = Rack
        fields = [
            "id",
            "name",
            "location",
            "location_detail",
            "description",
            "total_units",
            "devices_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "devices_count", "created_at", "updated_at"]


class DeviceSerializer(serializers.ModelSerializer):
    """Serializer for Device model."""

    device_type_detail = DeviceTypeSerializer(source="device_type", read_only=True)
    location_detail = serializers.SerializerMethodField()
    rack_detail = serializers.SerializerMethodField()
    hosts_count = serializers.SerializerMethodField()

    def get_location_detail(self, obj):
        """Return location summary."""
        if obj.location:
            return {
                "id": obj.location.id,
                "name": obj.location.name,
                "city": obj.location.city,
            }
        return None

    def get_rack_detail(self, obj):
        """Return rack summary."""
        if obj.rack:
            return {
                "id": obj.rack.id,
                "name": obj.rack.name,
                "location": obj.rack.location.name if obj.rack.location else None,
            }
        return None

    def get_hosts_count(self, obj):
        """Return count of IP addresses/hosts for this device."""
        return obj.get_hosts_count()

    class Meta:
        model = Device
        fields = [
            "id",
            "name",
            "ip_address",
            "device_type",
            "device_type_detail",
            "location",
            "location_detail",
            "rack",
            "rack_detail",
            "rack_position",
            "rack_size",
            "description",
            "vendor",
            "model",
            "version",
            "switch_port",
            "sections",
            "is_active",
            "hosts_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "hosts_count",
            "created_at",
            "updated_at",
        ]


class DeviceCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating devices."""

    class Meta:
        model = Device
        fields = [
            "name",
            "ip_address",
            "device_type",
            "location",
            "rack",
            "rack_position",
            "rack_size",
            "description",
            "vendor",
            "model",
            "version",
            "switch_port",
            "sections",
            "is_active",
        ]

    def validate_sections(self, value):
        """Validate sections list."""
        if not isinstance(value, list):
            raise serializers.ValidationError("Sections must be a list")
        valid_sections = ["servers", "ipv6"]
        for section in value:
            if section not in valid_sections:
                raise serializers.ValidationError(
                    f"Invalid section: {section}. Must be one of {valid_sections}"
                )
        return value


class RackCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating racks."""

    class Meta:
        model = Rack
        fields = [
            "name",
            "location",
            "description",
            "total_units",
        ]
