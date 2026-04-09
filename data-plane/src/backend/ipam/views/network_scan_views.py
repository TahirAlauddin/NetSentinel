"""
Network Scan ViewSets for IPAM.
"""

import logging
import threading

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from ..models import NetworkScan, ScanResult
from ..serializers import (
    NetworkScanCreateSerializer,
    NetworkScanSerializer,
    ScanResultDetailSerializer,
    ScanResultSerializer,
)

logger = logging.getLogger(__name__)


class NetworkScanViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing network scans.

    Provides endpoints for creating, viewing, and managing network scan jobs.
    """

    queryset = (
        NetworkScan.objects.select_related("subnet", "started_by").prefetch_related("results").all()
    )
    serializer_class = NetworkScanSerializer

    def get_serializer_class(self):
        """Use create serializer for POST requests."""
        if self.action == "create":
            return NetworkScanCreateSerializer
        return NetworkScanSerializer

    def get_queryset(self):
        """Filter scans by subnet if accessed via nested route."""
        queryset = super().get_queryset()

        subnet_pk = self.kwargs.get("subnet_pk")
        if subnet_pk:
            queryset = queryset.filter(subnet_id=subnet_pk)

        # Filter by status if provided
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    def create(self, request: Request, *args, **kwargs) -> Response:
        """Create and start a network scan."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        subnet_pk = self.kwargs.get("subnet_pk")
        if subnet_pk:
            subnet_id = subnet_pk
        else:
            subnet_id = serializer.validated_data["subnet"].id

        from ..models import Subnet
        from ..services.network_scanning import scan_subnet

        subnet = Subnet.objects.get(id=subnet_id)

        # Create scan record
        scan = NetworkScan.objects.create(
            subnet=subnet,
            scan_type=serializer.validated_data.get("scan_type", "ping"),
            timeout=serializer.validated_data.get("timeout", 3),
            max_hosts=serializer.validated_data.get("max_hosts"),
            started_by=self.request.user,
        )

        # Start scan in background thread to avoid blocking the HTTP request
        def run_scan() -> None:
            try:
                logger.info(f"Starting network scan {scan.id} for subnet {subnet.network}")
                scan_subnet(
                    subnet=subnet,
                    scan_type=scan.scan_type,
                    timeout=scan.timeout,
                    max_hosts=scan.max_hosts,
                    started_by=self.request.user,
                    scan_instance=scan,  # Pass the existing scan instance
                )
                logger.info(f"Network scan {scan.id} completed successfully")
            except Exception as e:
                logger.error(f"Network scan {scan.id} failed: {str(e)}", exc_info=True)
                scan.status = "failed"
                scan.error_message = str(e)
                scan.completed_at = timezone.now()
                scan.save()

        # Start scan in background thread
        thread = threading.Thread(target=run_scan, daemon=True)
        thread.start()

        # Return the scan immediately (scan will update as it progresses)
        response_serializer = NetworkScanSerializer(scan)
        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=["get"])
    def results(self, request: Request, pk=None) -> Response:
        """Get scan results for a specific scan."""
        scan = self.get_object()
        results = scan.results.all()
        serializer = ScanResultSerializer(results, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def summary(self, request: Request, pk=None) -> Response:
        """Get scan summary statistics."""
        from ..services.network_scanning import get_scan_summary

        scan = self.get_object()
        summary = get_scan_summary(scan.id)
        return Response(summary, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def import_results(self, request: Request, pk=None) -> Response:
        """Import scan results into IPAM."""
        from ..services.network_scanning import import_scan_results_to_ipam

        scan = self.get_object()
        import_new_hosts = request.data.get("import_new_hosts", True)
        update_existing = request.data.get("update_existing", False)

        results = import_scan_results_to_ipam(
            scan.id,
            import_new_hosts=import_new_hosts,
            update_existing=update_existing,
        )

        return Response(results, status=status.HTTP_200_OK)


class ScanResultViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing scan results.

    Read-only ViewSet for viewing individual scan results.
    """

    queryset = ScanResult.objects.select_related("scan", "scan__subnet").all()
    serializer_class = ScanResultDetailSerializer

    def get_queryset(self):
        """Filter results by scan if accessed via nested route."""
        queryset = super().get_queryset()

        scan_pk = self.kwargs.get("scan_pk")
        if scan_pk:
            queryset = queryset.filter(scan_id=scan_pk)

        # Filter by active status
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        # Filter by in_ipam
        in_ipam = self.request.query_params.get("in_ipam")
        if in_ipam is not None:
            queryset = queryset.filter(in_ipam=in_ipam.lower() == "true")

        return queryset
