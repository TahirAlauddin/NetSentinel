from rest_framework import serializers

from core.serializers import NameOnlyModelSerializer

from .models import (
    CarrierContact,
    Category,
    Circuit,
    CompanyProfile,
    Contact,
    Department,
    Location,
    PointOfContact,
    UtilityContact,
)


class PointOfContactSerializer(serializers.ModelSerializer):
    """Serializer for Point of Contact."""

    contact_type_display = serializers.CharField(source="get_contact_type_display", read_only=True)

    class Meta:
        model = PointOfContact
        fields = [
            "id",
            "circuit",
            "contact_type",
            "contact_type_display",
            "name",
            "email",
            "phone",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CircuitSerializer(serializers.ModelSerializer):
    """Serializer for Circuit."""

    location_name = serializers.CharField(source="location.__str__", read_only=True)
    points_of_contact = PointOfContactSerializer(many=True, read_only=True)

    class Meta:
        model = Circuit
        fields = [
            "id",
            "location",
            "location_name",
            "speed",
            "carrier",
            "circuit_id",
            "points_of_contact",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class LocationSerializer(serializers.ModelSerializer):
    """Serializer for Location."""

    circuits = CircuitSerializer(many=True, read_only=True)
    circuit_count = serializers.SerializerMethodField()

    def get_circuit_count(self, obj):
        return obj.circuits.count()

    class Meta:
        model = Location
        fields = [
            "id",
            "name",
            "alias",
            "address1",
            "address2",
            "city",
            "state",
            "zip_code",
            "phone",
            "longitude",
            "latitude",
            "type_building",
            "mpoe",
            "dmarc",
            "circuits",
            "circuit_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class AssetLocationSerializer(serializers.ModelSerializer):
    """Serializer for Location."""

    class Meta:
        model = Location
        fields = [
            "id",
            "name",
            "alias",
            "address1",
            "address2",
            "city",
            "state",
            "zip_code",
            "phone",
            "longitude",
            "latitude",
            "type_building",
            "mpoe",
            "dmarc",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class DepartmentSerializer(NameOnlyModelSerializer):
    """Serializer for Department."""

    class Meta(NameOnlyModelSerializer.Meta):
        model = Department


class CategorySerializer(NameOnlyModelSerializer):
    """Serializer for Category."""

    class Meta(NameOnlyModelSerializer.Meta):
        model = Category


class ContactSerializer(serializers.ModelSerializer):
    """Serializer for Contact."""

    class Meta:
        model = Contact
        fields = [
            "id",
            "first_name",
            "last_name",
            "job_title",
            "business_phone",
            "alternate_phone",
            "mobile_phone",
            "address1",
            "address2",
            "city",
            "state",
            "zip_code",
            "country",
            "contact_type",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CarrierContactSerializer(serializers.ModelSerializer):
    """Serializer for Carrier Contact."""

    location_name = serializers.CharField(source="location.name", read_only=True)

    class Meta:
        model = CarrierContact
        fields = [
            "id",
            "name",
            "location",
            "location_name",
            "customer_service_phone",
            "technical_support_phone",
            "sales_phone",
            "billing_phone",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class UtilityContactSerializer(serializers.ModelSerializer):
    """Serializer for Utility Contact."""

    location_name = serializers.CharField(source="location.name", read_only=True)
    utility_type_display = serializers.CharField(source="get_utility_type_display", read_only=True)

    class Meta:
        model = UtilityContact
        fields = [
            "id",
            "name",
            "location",
            "location_name",
            "address1",
            "address2",
            "city",
            "state",
            "zip_code",
            "customer_service_phone",
            "technical_support_phone",
            "sales_phone",
            "billing_phone",
            "utility_type",
            "utility_type_display",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CompanyProfileSerializer(serializers.ModelSerializer):
    """Serializer for tenant/company profile settings."""

    class Meta:
        model = CompanyProfile
        fields = [
            "id",
            "company_name",
            "subdomain",
            "company_url",
            "main_contact",
            "phone_country",
            "phone_number",
            "phone_extension",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
