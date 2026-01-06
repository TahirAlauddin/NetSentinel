from rest_framework import serializers

from infrastructure.serializers import AssetLocationSerializer

from ..models import DNSRecord, DNSZone


class DNSZoneSerializer(serializers.ModelSerializer):
    """Serializer for DNSZone."""

    location_detail = AssetLocationSerializer(source="location", read_only=True)
    records_count = serializers.SerializerMethodField()

    def get_records_count(self, obj):
        """Return count of DNS records in this zone."""
        return obj.records.count()

    class Meta:
        model = DNSZone
        fields = [
            "id",
            "name",
            "description",
            "location",
            "location_detail",
            "records_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class DNSRecordSerializer(serializers.ModelSerializer):
    """Serializer for DNSRecord."""

    zone_detail = DNSZoneSerializer(source="zone", read_only=True)
    record_type_display = serializers.CharField(source="get_record_type_display", read_only=True)

    class Meta:
        model = DNSRecord
        fields = [
            "id",
            "zone",
            "zone_detail",
            "name",
            "record_type",
            "record_type_display",
            "value",
            "ttl",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
