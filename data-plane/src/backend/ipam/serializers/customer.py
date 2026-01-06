"""
Customer serializer for IPAM.

This module provides serialization for customer profiles used in IP address management.
"""

from rest_framework import serializers

from ..models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    """
    Serializer for Customer model.

    Serializes customer information including contact details.
    Used for tracking customer ownership of IP subnets and resources.
    """

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
