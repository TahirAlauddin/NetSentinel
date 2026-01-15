"""
Network Scan serializers for IPAM.
"""

from rest_framework import serializers

from ..models import NetworkScan, ScanResult
from .subnet import SubnetSerializer


class ScanResultSerializer(serializers.ModelSerializer):
    """Serializer for ScanResult model."""

    class Meta:
        model = ScanResult
        fields = [
            "id",
            "scan",
            "ip_address",
            "is_active",
            "response_time",
            "mac_address",
            "hostname",
            "vendor",
            "in_ipam",
            "ipam_status",
            "open_ports",
            "notes",
            "discovered_at",
        ]
        read_only_fields = ["id", "discovered_at"]


class NetworkScanSerializer(serializers.ModelSerializer):
    """Serializer for NetworkScan model."""

    subnet_detail = SubnetSerializer(source="subnet", read_only=True)
    started_by_detail = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    scan_type_display = serializers.CharField(source="get_scan_type_display", read_only=True)
    duration = serializers.SerializerMethodField()
    results_count = serializers.SerializerMethodField()

    def get_started_by_detail(self, obj):
        """Return user details if exists."""
        if obj.started_by:
            return {
                "id": obj.started_by.id,
                "username": obj.started_by.username,
                "email": obj.started_by.email,
            }
        return None

    def get_duration(self, obj):
        """Return scan duration in seconds."""
        return obj.duration

    def get_results_count(self, obj):
        """Return count of scan results."""
        return obj.results.count()

    class Meta:
        model = NetworkScan
        fields = [
            "id",
            "subnet",
            "subnet_detail",
            "scan_type",
            "scan_type_display",
            "status",
            "status_display",
            "started_by",
            "started_by_detail",
            "timeout",
            "max_hosts",
            "hosts_found",
            "hosts_new",
            "hosts_missing",
            "started_at",
            "completed_at",
            "created_at",
            "updated_at",
            "error_message",
            "duration",
            "results_count",
        ]
        read_only_fields = [
            "id",
            "status",
            "hosts_found",
            "hosts_new",
            "hosts_missing",
            "started_at",
            "completed_at",
            "created_at",
            "updated_at",
            "error_message",
        ]


class NetworkScanCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a network scan."""

    timeout = serializers.IntegerField(default=3, min_value=1, max_value=30)
    max_hosts = serializers.IntegerField(required=False, min_value=1, allow_null=True)

    class Meta:
        model = NetworkScan
        fields = [
            "subnet",
            "scan_type",
            "timeout",
            "max_hosts",
        ]


class ScanResultDetailSerializer(ScanResultSerializer):
    """Detailed serializer for ScanResult with scan information."""

    scan_detail = NetworkScanSerializer(source="scan", read_only=True)

    class Meta(ScanResultSerializer.Meta):
        fields = ScanResultSerializer.Meta.fields + ["scan_detail"]
