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

    def create(self, validated_data):
        """
        Create a DNS record, setting zone from context if provided.

        If zone_pk is in the serializer context (from nested routes or tests),
        it will be used to set the zone. If zone_id is already in validated_data
        (from viewset's perform_create), it will be used as-is.
        """
        # Only set zone_id from context if it's not already in validated_data
        # (viewset's perform_create may have already set it via save(zone_id=...))
        if "zone_id" not in validated_data:
            zone_pk = self.context.get("zone_pk")
            if zone_pk:
                validated_data["zone_id"] = zone_pk

        return super().create(validated_data)

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
        read_only_fields = ["id", "zone", "created_at", "updated_at"]
