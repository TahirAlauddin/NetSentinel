"""
Subnet Threshold serializers for IPAM.
"""

from typing import Any, Dict

from rest_framework import serializers

from ..models import SubnetThreshold, SubnetThresholdAlert
from .subnet import SubnetSerializer


class SubnetThresholdAlertSerializer(serializers.ModelSerializer):
    """Serializer for SubnetThresholdAlert model."""

    alert_type_display = serializers.CharField(source="get_alert_type_display", read_only=True)
    threshold_detail = serializers.SerializerMethodField()
    acknowledged_by_username = serializers.CharField(
        source="acknowledged_by.username", read_only=True
    )

    def get_threshold_detail(self, obj: SubnetThresholdAlert) -> Dict[str, Any]:
        """Return threshold details."""
        return {
            "id": obj.threshold.id,
            "subnet_id": obj.threshold.subnet.id,
            "subnet_network": obj.threshold.subnet.network,
            "warning_threshold": obj.threshold.warning_threshold,
            "critical_threshold": obj.threshold.critical_threshold,
        }

    class Meta:
        model = SubnetThresholdAlert
        fields = [
            "id",
            "threshold",
            "threshold_detail",
            "alert_type",
            "alert_type_display",
            "utilization_percentage",
            "message",
            "sent_to",
            "sent_at",
            "acknowledged",
            "acknowledged_by",
            "acknowledged_by_username",
            "acknowledged_at",
        ]
        read_only_fields = [
            "id",
            "sent_at",
            "acknowledged",
            "acknowledged_by",
            "acknowledged_at",
        ]


class SubnetThresholdSerializer(serializers.ModelSerializer):
    """Serializer for SubnetThreshold model."""

    subnet_detail = SubnetSerializer(source="subnet", read_only=True)
    current_status_display = serializers.CharField(
        source="get_current_status_display", read_only=True
    )
    alerts_count = serializers.SerializerMethodField()
    unacknowledged_alerts_count = serializers.SerializerMethodField()

    def get_alerts_count(self, obj: SubnetThreshold) -> int:
        """Return total number of alerts."""
        return obj.alerts.count()

    def get_unacknowledged_alerts_count(self, obj: SubnetThreshold) -> int:
        """Return number of unacknowledged alerts."""
        return obj.alerts.filter(acknowledged=False).count()

    class Meta:
        model = SubnetThreshold
        fields = [
            "id",
            "subnet",
            "subnet_detail",
            "warning_threshold",
            "critical_threshold",
            "enable_alerts",
            "alert_email",
            "notify_on_warning",
            "notify_on_critical",
            "notify_on_recovery",
            "last_checked",
            "last_alert_sent",
            "current_status",
            "current_status_display",
            "alerts_count",
            "unacknowledged_alerts_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "last_checked",
            "last_alert_sent",
            "current_status",
            "created_at",
            "updated_at",
        ]


class SubnetThresholdCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating SubnetThreshold."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        """Initialize serializer and set subnet queryset."""
        super().__init__(*args, **kwargs)
        # Set queryset for subnet field
        from ..models import Subnet

        self.fields["subnet"] = serializers.PrimaryKeyRelatedField(
            queryset=Subnet.objects.all(),
        )

    class Meta:
        model = SubnetThreshold
        fields = [
            "subnet",
            "warning_threshold",
            "critical_threshold",
            "enable_alerts",
            "alert_email",
            "notify_on_warning",
            "notify_on_critical",
            "notify_on_recovery",
        ]

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate that warning threshold is less than critical threshold."""
        warning = data.get(
            "warning_threshold", self.instance.warning_threshold if self.instance else 75
        )
        critical = data.get(
            "critical_threshold", self.instance.critical_threshold if self.instance else 90
        )

        if warning >= critical:
            raise serializers.ValidationError(
                "Warning threshold must be less than critical threshold"
            )

        return data
