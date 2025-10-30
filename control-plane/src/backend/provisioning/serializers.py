"""
Serializers for provisioning API.
"""

from rest_framework import serializers
from .models import TenantProvisioning, ProvisioningStatus


class TenantProvisioningSerializer(serializers.ModelSerializer):
    """Serializer for TenantProvisioning model."""

    company_name = serializers.CharField(source="company.name", read_only=True)
    company_id = serializers.UUIDField(source="company.id", read_only=True)

    class Meta:
        model = TenantProvisioning
        fields = [
            "id",
            "company_id",
            "company_name",
            "status",
            "namespace_name",
            "error_message",
            "logs",
            "created_at",
            "updated_at",
            "completed_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "namespace_name",
            "error_message",
            "logs",
            "created_at",
            "updated_at",
            "completed_at",
        ]


class ProvisionTriggerSerializer(serializers.Serializer):
    """Serializer for manual provisioning trigger."""

    force = serializers.BooleanField(default=False, required=False)
