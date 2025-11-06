from rest_framework import serializers
from .models import Location, Circuit, PointOfContact, Department, Category


class PointOfContactSerializer(serializers.ModelSerializer):
    """Serializer for Point of Contact."""

    contact_type_display = serializers.CharField(
        source="get_contact_type_display", read_only=True
    )

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
            "city",
            "address",
            "circuits",
            "circuit_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class DepartmentSerializer(serializers.ModelSerializer):
    """Serializer for Department."""

    class Meta:
        model = Department
        fields = [
            "id",
            "name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category."""

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
