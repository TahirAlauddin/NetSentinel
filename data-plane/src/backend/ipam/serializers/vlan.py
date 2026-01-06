from rest_framework import serializers

from infrastructure.serializers import AssetLocationSerializer
from ..models import VLAN


class VLANSerializer(serializers.ModelSerializer):
    """Serializer for VLAN."""

    location_detail = AssetLocationSerializer(source="location", read_only=True)

    class Meta:
        model = VLAN
        fields = [
            "id",
            "vlan_id",
            "name",
            "description",
            "location",
            "location_detail",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
