from rest_framework import serializers

from ..models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    """Serializer for Customer."""

    class Meta:
        model = Customer
        fields = [
            "id",
            "name",
            "description",
            "contact_email",
            "contact_phone",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
