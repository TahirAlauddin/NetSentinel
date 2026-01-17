"""
IP Audit Log ViewSets for IPAM.
"""

from django.utils import timezone
from datetime import timedelta
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import IPAuditLog, IPAuditLogFilter
from ..serializers import IPAuditLogSerializer, IPAuditLogFilterSerializer
from ..services.ip_audit_log import get_audit_logs, get_audit_log_summary


class IPAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing IP audit logs.
    
    Provides read-only access to audit logs with filtering capabilities.
    """

    queryset = IPAuditLog.objects.select_related("user", "ip_address").all()
    serializer_class = IPAuditLogSerializer

    def get_queryset(self):
        """Filter audit logs based on query parameters."""
        queryset = super().get_queryset()

        # Filter by IP address
        ip_address = self.request.query_params.get("ip_address")
        if ip_address:
            queryset = queryset.filter(ip_address_str=ip_address)

        # Filter by IP address ID
        ip_address_id = self.request.query_params.get("ip_address_id")
        if ip_address_id:
            queryset = queryset.filter(ip_address_id=ip_address_id)

        # Filter by user
        user_id = self.request.query_params.get("user")
        if user_id:
            queryset = queryset.filter(user_id=user_id)

        # Filter by action
        action = self.request.query_params.get("action")
        if action:
            queryset = queryset.filter(action=action)

        # Filter by date range
        start_date = self.request.query_params.get("start_date")
        if start_date:
            try:
                start_date_obj = timezone.datetime.fromisoformat(start_date.replace("Z", "+00:00"))
                queryset = queryset.filter(created_at__gte=start_date_obj)
            except (ValueError, AttributeError):
                pass

        end_date = self.request.query_params.get("end_date")
        if end_date:
            try:
                end_date_obj = timezone.datetime.fromisoformat(end_date.replace("Z", "+00:00"))
                queryset = queryset.filter(created_at__lte=end_date_obj)
            except (ValueError, AttributeError):
                pass

        # Limit results
        limit = int(self.request.query_params.get("limit", 100))
        if limit > 1000:
            limit = 1000  # Max limit

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
            writer.writerow([
                "ID",
                "IP Address",
                "Action",
                "User",
                "Field Name",
                "Old Value",
                "New Value",
                "Reason",
                "Created At",
            ])

            for log in queryset:
                writer.writerow([
                    log.id,
                    log.ip_address_str,
                    log.get_action_display(),
                    log.display_user,
                    log.field_name or "",
                    log.old_value or "",
                    log.new_value or "",
                    log.reason or "",
                    log.created_at.isoformat(),
                ])

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
