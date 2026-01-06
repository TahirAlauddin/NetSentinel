"""
Subnet Group serializer for IPAM.

This module provides serialization for subnet groups used to organize subnets.
"""

from rest_framework import serializers

from ..models import SubnetGroup


class SubnetGroupSerializer(serializers.ModelSerializer):
    """
    Serializer for SubnetGroup model.

    Serializes subnet group information for organizing subnets into logical collections.
    """

    class Meta:
        model = SubnetGroup
        fields = [
            "id",
            "name",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
