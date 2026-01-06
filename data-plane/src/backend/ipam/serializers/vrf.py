from rest_framework import serializers

from infrastructure.serializers import AssetLocationSerializer
from ..models import VRF


class VRFSerializer(serializers.ModelSerializer):
    """Serializer for VRF."""

    location_detail = AssetLocationSerializer(source="location", read_only=True)

    class Meta:
        model = VRF
        fields = [
            "id",
            "name",
            "rd",
            "description",
            "location",
            "location_detail",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
