"""
IP Audit Log ViewSets for IPAM.
"""

from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import IPAuditLog, IPAuditLogFilter
from ..serializers import IPAuditLogFilterSerializer, IPAuditLogSerializer
from ..services.ip_audit_log import get_audit_log_summary


class IPAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing IP audit logs.

    Provides read-only access to audit logs with filtering capabilities.
    """

    queryset = IPAuditLog.objects.select_related("user", "ip_address").all()
    serializer_class = IPAuditLogSerializer

    def _parse_date(self, date_str):
        """Parse ISO format date string to datetime object."""
        if not date_str:
            return None
        try:
            return timezone.datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except (ValueError, AttributeError):
            return None

    def _apply_filters(self, queryset, query_params):
        """Apply filters to queryset based on query parameters."""
        # Filter by IP address
        if ip_address := query_params.get("ip_address"):
            queryset = queryset.filter(ip_address_str=ip_address)

        # Filter by IP address ID
        if ip_address_id := query_params.get("ip_address_id"):
            queryset = queryset.filter(ip_address_id=ip_address_id)

        # Filter by user
        if user_id := query_params.get("user"):
            queryset = queryset.filter(user_id=user_id)

        # Filter by action
        if action := query_params.get("action"):
            queryset = queryset.filter(action=action)

        # Filter by date range
        if start_date := self._parse_date(query_params.get("start_date")):
            queryset = queryset.filter(created_at__gte=start_date)

        if end_date := self._parse_date(query_params.get("end_date")):
            queryset = queryset.filter(created_at__lte=end_date)

        return queryset

    def _get_limit(self, query_params):
        """Get and validate limit parameter."""
        limit = int(query_params.get("limit", 100))
        return min(limit, 1000)  # Max limit

    def get_queryset(self):
        """Filter audit logs based on query parameters."""
        queryset = super().get_queryset()
        queryset = self._apply_filters(queryset, self.request.query_params)
        limit = self._get_limit(self.request.query_params)
        return queryset[:limit]

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        """
        Get audit log summary statistics.

        GET /api/v1/ipam/ip-audit-logs/summary/?ip_address=192.168.1.1&days=30
        """
        ip_address = request.query_params.get("ip_address")
        days = int(request.query_params.get("days", 30))

        summary = get_audit_log_summary(ip_address=ip_address, days=days)
        return Response(summary, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="export")
    def export(self, request):
        """
        Export audit logs to CSV.

        GET /api/v1/ipam/ip-audit-logs/export/?format=csv&ip_address=192.168.1.1
        """
        import csv

        from django.http import HttpResponse

        queryset = self.get_queryset()
        format_type = request.query_params.get("format", "csv")

        if format_type == "csv":
            response = HttpResponse(content_type="text/csv")
            response["Content-Disposition"] = 'attachment; filename="ip_audit_logs.csv"'

            writer = csv.writer(response)
            writer.writerow(
                [
                    "ID",
                    "IP Address",
                    "Action",
                    "User",
                    "Field Name",
                    "Old Value",
                    "New Value",
                    "Reason",
                    "Created At",
                ]
            )

            for log in queryset:
                writer.writerow(
                    [
                        log.id,
                        log.ip_address_str,
                        log.get_action_display(),
                        log.display_user,
                        log.field_name or "",
                        log.old_value or "",
                        log.new_value or "",
                        log.reason or "",
                        log.created_at.isoformat(),
                    ]
                )

            return response

        return Response(
            {"error": "Unsupported format"},
            status=status.HTTP_400_BAD_REQUEST,
        )


class IPAuditLogFilterViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing saved audit log filters.

    Allows users to save and reuse filter combinations.
    """

    queryset = IPAuditLogFilter.objects.all()
    serializer_class = IPAuditLogFilterSerializer

    def get_queryset(self):
        """Filter to only show current user's filters."""
        queryset = super().get_queryset()
        return queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Set the user when creating a filter."""
        serializer.save(user=self.request.user)
