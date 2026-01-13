"""
Phone Number serializer for IPAM.
"""

from rest_framework import serializers

from infrastructure.serializers import AssetLocationSerializer
from ..models import PhoneNumberRange


class PhoneNumberRangeSerializer(serializers.ModelSerializer):
    """Serializer for PhoneNumberRange model."""

    location_detail = AssetLocationSerializer(source="location", read_only=True)
    number_count = serializers.SerializerMethodField()

    def get_number_count(self, obj):
        """Return the count of phone numbers in the range."""
        return obj.get_number_count()

    class Meta:
        model = PhoneNumberRange
        fields = [
            "id",
            "location",
            "location_detail",
            "carrier",
            "trunk",
            "start_number",
            "stop_number",
            "notes",
            "number_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "number_count"]


class PhoneNumberRangeCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating phone number ranges."""

    class Meta:
        model = PhoneNumberRange
        fields = [
            "location",
            "carrier",
            "trunk",
            "start_number",
            "stop_number",
            "notes",
        ]

    def validate(self, data):
        """Validate that start_number is less than or equal to stop_number."""
        start_number = data.get("start_number", "")
        stop_number = data.get("stop_number", "")
        
        if start_number and stop_number:
            # Extract numeric parts for comparison
            try:
                start_digits = int("".join(filter(str.isdigit, start_number)))
                stop_digits = int("".join(filter(str.isdigit, stop_number)))
                
                if start_digits > stop_digits:
                    raise serializers.ValidationError(
                        "Start number must be less than or equal to stop number"
                    )
            except (ValueError, AttributeError):
                # If we can't parse, just let it through - validation will happen elsewhere
                pass
        
        return data
