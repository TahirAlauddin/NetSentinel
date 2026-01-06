"""
IP Address serializer for IPAM.

This module provides serialization for individual IP address models.
"""

from rest_framework import serializers

from ..models import IPAddress
from .subnet import SubnetSerializer


class IPAddressSerializer(serializers.ModelSerializer):
    """
    Serializer for IPAddress model.

    Serializes individual IP address information with subnet details.
    Supports both IPv4 and IPv6 addresses.
    """

    subnet_detail = SubnetSerializer(source="subnet", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

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
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
