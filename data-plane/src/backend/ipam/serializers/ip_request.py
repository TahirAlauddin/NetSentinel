"""
IP Request serializer for IPAM.

This module provides serialization for IP address reservation requests.
"""

from rest_framework import serializers

from ..models import IPAddress, IPRequest, Subnet
from ..services.subnet_utils import is_ip_in_subnet
from .ip_address import IPAddressSerializer
from .subnet import SubnetSerializer


class IPRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for IPRequest model.

    Serializes IP address reservation requests with nested details.
    Includes validation for IP address assignment and subnet membership.
    """

    subnet = serializers.PrimaryKeyRelatedField(read_only=True)
    subnet_detail = SubnetSerializer(source="subnet", read_only=True)
    requested_by_detail = serializers.SerializerMethodField()
    approved_by_detail = serializers.SerializerMethodField()
    ip_address_detail = IPAddressSerializer(source="ip_address", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    is_expired = serializers.SerializerMethodField()
    can_be_approved = serializers.SerializerMethodField()
    can_be_rejected = serializers.SerializerMethodField()

    def to_representation(self, instance):
        """Override to ensure subnet returns as integer."""
        data = super().to_representation(instance)
        if "subnet" in data and data["subnet"] is not None:
            data["subnet"] = int(data["subnet"])
        return data

    def get_requested_by_detail(self, obj):
        """Return requester user details."""
        if obj.requested_by:
            return {
                "id": obj.requested_by.id,
                "username": obj.requested_by.username,
                "email": obj.requested_by.email,
                "full_name": obj.requested_by.get_full_name(),
            }
        return None

    def get_approved_by_detail(self, obj):
        """Return approver user details."""
        if obj.approved_by:
            return {
                "id": obj.approved_by.id,
                "username": obj.approved_by.username,
                "email": obj.approved_by.email,
                "full_name": obj.approved_by.get_full_name(),
            }
        return None

    def get_is_expired(self, obj):
        """Check if reservation is expired."""
        return obj.is_expired()

    def get_can_be_approved(self, obj):
        """Check if request can be approved."""
        return obj.can_be_approved()

    def get_can_be_rejected(self, obj):
        """Check if request can be rejected."""
        return obj.can_be_rejected()

    def validate_requested_ip(self, value):
        """Validate that requested IP is in the subnet."""
        if value:
            # Get subnet from context (will be set in validate method)
            subnet = self.initial_data.get("subnet")
            if subnet:
                try:
                    subnet_obj = Subnet.objects.get(id=subnet)
                    if not is_ip_in_subnet(str(value), subnet_obj.network):
                        raise serializers.ValidationError(
                            f"IP address {value} is not in subnet {subnet_obj.network}"
                        )
                except Subnet.DoesNotExist:
                    raise serializers.ValidationError("Invalid subnet")
        return value

    def validate(self, data):
        """Validate the entire request."""
        subnet = data.get("subnet")
        requested_ip = data.get("requested_ip")

        if subnet and requested_ip:
            # Validate IP is in subnet
            if not is_ip_in_subnet(str(requested_ip), subnet.network):
                raise serializers.ValidationError(
                    {"requested_ip": f"IP address {requested_ip} is not in subnet {subnet.network}"}
                )

            # Check if IP already exists
            existing_ip = IPAddress.objects.filter(address=requested_ip).first()
            if existing_ip and existing_ip.status not in ("available", "deprecated"):
                status_display = existing_ip.get_status_display()
                raise serializers.ValidationError(
                    {
                        "requested_ip": (
                            f"IP address {requested_ip} is already in use "
                            f"(status: {status_display})"
                        )
                    }
                )

        return data

    class Meta:
        model = IPRequest
        fields = [
            "id",
            "requested_by",
            "requested_by_detail",
            "subnet",
            "subnet_detail",
            "requested_ip",
            "status",
            "status_display",
            "purpose",
            "description",
            "approved_by",
            "approved_by_detail",
            "approval_notes",
            "approved_at",
            "reservation_expires_at",
            "ip_address",
            "ip_address_detail",
            "is_expired",
            "can_be_approved",
            "can_be_rejected",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "requested_by",
            "status",
            "approved_by",
            "approved_at",
            "ip_address",
            "created_at",
            "updated_at",
        ]


class IPRequestCreateSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for creating IP requests.

    Automatically sets the requested_by field to the current user.
    Subnet can be provided in request data or via nested route URL parameter.
    """

    subnet = serializers.PrimaryKeyRelatedField(
        queryset=Subnet.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = IPRequest
        fields = [
            "subnet",
            "requested_ip",
            "purpose",
            "description",
            "reservation_expires_at",
        ]

    def validate(self, data):
        """Validate that subnet is provided either in data or context."""
        # If subnet is not in data, it should be in context (from nested route)
        subnet_pk = self.context.get("subnet_pk")
        if subnet_pk and not data.get("subnet"):
            # Set subnet from context if not provided in data
            from ..models import Subnet

            try:
                data["subnet"] = Subnet.objects.get(id=subnet_pk)
            except Subnet.DoesNotExist:
                raise serializers.ValidationError(
                    {"subnet": f"Subnet with id {subnet_pk} not found."}
                )
        elif not data.get("subnet") and not subnet_pk:
            raise serializers.ValidationError(
                {"subnet": "Subnet is required. Provide it in request data or via nested route."}
            )
        return data
