from rest_framework import serializers
from .models import Provider, DataCircuit


class ProviderSerializer(serializers.ModelSerializer):
    """Serializer for Provider."""

    service_type_display = serializers.CharField(
        source="get_service_type_display", read_only=True
    )
    status_display = serializers.CharField(
        source="get_status_display", read_only=True
    )
    data_circuit_count = serializers.SerializerMethodField()

    def get_data_circuit_count(self, obj):
        return obj.data_circuits.count()

    class Meta:
        model = Provider
        fields = [
            "id",
            "name",
            "description",
            "service_type",
            "service_type_display",
            "status",
            "status_display",
            "account_number",
            "contact_name",
            "contact_email",
            "contact_phone",
            "website",
            "logo_url",
            "monthly_cost",
            "notes",
            "data_circuit_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class DataCircuitSerializer(serializers.ModelSerializer):
    """Serializer for Data Circuit."""

    provider_name = serializers.CharField(source="provider.name", read_only=True)
    location_name = serializers.CharField(source="location.name", read_only=True)
    circuit_type_display = serializers.CharField(
        source="get_circuit_type_display", read_only=True
    )
    line_speed_display = serializers.CharField(
        source="get_line_speed_display", read_only=True
    )
    handoff_type_display = serializers.CharField(
        source="get_handoff_type_display", read_only=True
    )
    fiber_type_display = serializers.CharField(
        source="get_fiber_type_display", read_only=True
    )
    connector_type_display = serializers.CharField(
        source="get_connector_type_display", read_only=True
    )

    class Meta:
        model = DataCircuit
        fields = [
            "id",
            "provider",
            "provider_name",
            "location",
            "location_name",
            "circuit_id",
            "alternate_cid",
            "carrier",
            "account_number",
            "security_code",
            "circuit_type",
            "circuit_type_display",
            "line_speed",
            "line_speed_display",
            "port_speed",
            "handoff_type",
            "handoff_type_display",
            "fiber_type",
            "fiber_type_display",
            "connector_type",
            "connector_type_display",
            "quote_id",
            "contract_id",
            "foc_date",
            "ttu_date",
            "monthly_cost",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

