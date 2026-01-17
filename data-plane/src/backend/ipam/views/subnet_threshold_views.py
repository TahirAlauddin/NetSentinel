"""
Subnet Threshold ViewSets for IPAM.
"""

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone

from ..models import SubnetThreshold, SubnetThresholdAlert
from ..serializers import (
    SubnetThresholdSerializer,
    SubnetThresholdCreateUpdateSerializer,
    SubnetThresholdAlertSerializer,
)
from ..services.subnet_threshold import (
    check_subnet_threshold,
    check_all_thresholds,
    get_threshold_summary,
)


class SubnetThresholdViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing subnet thresholds.
    
    Provides CRUD operations for subnet utilization thresholds.
    """

    queryset = SubnetThreshold.objects.select_related("subnet").all()
    serializer_class = SubnetThresholdSerializer

    def get_serializer_class(self):
        """Use create/update serializer for POST/PUT/PATCH requests."""
        if self.action in ["create", "update", "partial_update"]:
            return SubnetThresholdCreateUpdateSerializer
        return SubnetThresholdSerializer

    def get_queryset(self):
        """Filter thresholds by subnet and status."""
        queryset = super().get_queryset()

        subnet_id = self.request.query_params.get("subnet")
        if subnet_id:
            queryset = queryset.filter(subnet_id=subnet_id)

        current_status = self.request.query_params.get("status")
        if current_status:
            queryset = queryset.filter(current_status=current_status)

        enable_alerts = self.request.query_params.get("enable_alerts")
        if enable_alerts is not None:
            queryset = queryset.filter(enable_alerts=enable_alerts.lower() == "true")

        return queryset

    @action(detail=True, methods=["post"], url_path="check")
    def check_threshold(self, request, pk=None):
        """Manually check a subnet threshold."""
        threshold = self.get_object()
        result = check_subnet_threshold(threshold.subnet.id)
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="check-all")
    def check_all(self, request):
        """Check all subnet thresholds."""
        result = check_all_thresholds()
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        """Get threshold summary statistics."""
        subnet_id = request.query_params.get("subnet_id")
        summary = get_threshold_summary(subnet_id=int(subnet_id) if subnet_id else None)
        return Response(summary, status=status.HTTP_200_OK)


class SubnetThresholdAlertViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing subnet threshold alerts.
    
    Provides read-only access to threshold alerts.
    """

    queryset = SubnetThresholdAlert.objects.select_related(
        "threshold", "threshold__subnet", "acknowledged_by"
    ).all()
    serializer_class = SubnetThresholdAlertSerializer

    def get_queryset(self):
        """Filter alerts by threshold and status."""
        queryset = super().get_queryset()

        threshold_id = self.request.query_params.get("threshold")
        if threshold_id:
            queryset = queryset.filter(threshold_id=threshold_id)

        subnet_id = self.request.query_params.get("subnet")
        if subnet_id:
            queryset = queryset.filter(threshold__subnet_id=subnet_id)

        alert_type = self.request.query_params.get("alert_type")
        if alert_type:
            queryset = queryset.filter(alert_type=alert_type)

        acknowledged = self.request.query_params.get("acknowledged")
        if acknowledged is not None:
            queryset = queryset.filter(acknowledged=acknowledged.lower() == "true")

        return queryset

    @action(detail=True, methods=["post"], url_path="acknowledge")
    def acknowledge(self, request, pk=None):
        """Acknowledge an alert."""
        alert = self.get_object()
        alert.acknowledged = True
        alert.acknowledged_by = request.user
        alert.acknowledged_at = timezone.now()
        alert.save()

        serializer = self.get_serializer(alert)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="bulk-acknowledge")
    def bulk_acknowledge(self, request):
        """Acknowledge multiple alerts."""
        alert_ids = request.data.get("alert_ids", [])

        if not alert_ids:
            return Response(
                {"error": "alert_ids is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated = SubnetThresholdAlert.objects.filter(
            id__in=alert_ids
        ).update(
            acknowledged=True,
            acknowledged_by=request.user,
            acknowledged_at=timezone.now(),
        )

        return Response(
            {"acknowledged": updated},
            status=status.HTTP_200_OK,
        )
