from rest_framework import serializers

from ..models import IPAddress
from .subnet import SubnetSerializer


class IPAddressSerializer(serializers.ModelSerializer):
    """Serializer for IPAddress."""

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
