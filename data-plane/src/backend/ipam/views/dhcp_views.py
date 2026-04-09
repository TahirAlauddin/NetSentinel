"""
DHCP ViewSets for IPAM.
"""

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from ..models import DHCPLease, DHCPOption, DHCPReservation, DHCPScope
from ..serializers import (
    DHCPLeaseCreateSerializer,
    DHCPLeaseSerializer,
    DHCPOptionCreateUpdateSerializer,
    DHCPOptionSerializer,
    DHCPReservationSerializer,
    DHCPScopeCreateUpdateSerializer,
    DHCPScopeSerializer,
)


class DHCPScopeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing DHCP scopes.

    Provides endpoints for creating, viewing, and managing DHCP scopes.
    """

    queryset = (
        DHCPScope.objects.select_related("subnet")
        .prefetch_related("leases", "reservations", "options")
        .all()
    )
    serializer_class = DHCPScopeSerializer

    def get_serializer_class(self):
        """Use create serializer for POST requests."""
        if self.action == "create":
            return DHCPScopeCreateUpdateSerializer
        elif self.action in ["update", "partial_update"]:
            return DHCPScopeCreateUpdateSerializer
        return DHCPScopeSerializer

    def get_queryset(self):
        """Filter scopes by subnet if accessed via nested route."""
        queryset = super().get_queryset()

        subnet_pk = self.kwargs.get("subnet_pk")
        if subnet_pk:
            queryset = queryset.filter(subnet_id=subnet_pk)

        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        return queryset

    @action(detail=True, methods=["get"])
    def availability(self, request: Request, pk=None) -> Response:
        """Get scope availability statistics."""
        from ..services.dhcp import calculate_scope_availability

        scope = self.get_object()
        availability = calculate_scope_availability(scope.id)
        return Response(availability, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def leases(self, request: Request, pk=None) -> Response:
        """Get all leases for a scope."""
        scope = self.get_object()
        leases = scope.leases.all()

        status_filter = request.query_params.get("status")
        if status_filter:
            leases = leases.filter(status=status_filter)

        serializer = DHCPLeaseSerializer(leases, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def reservations(self, request: Request, pk=None) -> Response:
        """Get all reservations for a scope."""
        scope = self.get_object()
        reservations = scope.reservations.filter(is_active=True)
        serializer = DHCPReservationSerializer(reservations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def assign_ip(self, request: Request, pk=None) -> Response:
        """Automatically assign an IP from the scope."""
        from ..services.dhcp import assign_ip_from_dhcp_pool

        scope = self.get_object()
        mac_address = request.data.get("mac_address")
        hostname = request.data.get("hostname")

        if not mac_address:
            return Response(
                {"error": "mac_address is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ip_address = assign_ip_from_dhcp_pool(scope.id, mac_address, hostname)

        if ip_address:
            return Response(
                {"ip_address": ip_address},
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {"error": "No available IPs in scope"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=["get"], url_path="export-config")
    def export_config(self, request: Request, pk=None) -> Response:
        """Export DHCP scope configuration."""
        from ..services.dhcp import export_dhcp_config

        scope = self.get_object()
        format = request.query_params.get("format", "isc-dhcpd")

        config = export_dhcp_config(scope.id, format)

        from django.http import HttpResponse

        response = HttpResponse(config, content_type="text/plain")
        response["Content-Disposition"] = f'attachment; filename="dhcp-scope-{scope.id}.conf"'
        return response


class DHCPLeaseViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing DHCP leases.

    Provides endpoints for viewing and managing DHCP leases.
    """

    queryset = DHCPLease.objects.select_related("scope", "scope__subnet").all()
    serializer_class = DHCPLeaseSerializer

    def get_serializer_class(self):
        """Use create serializer for POST requests."""
        if self.action == "create":
            return DHCPLeaseCreateSerializer
        return DHCPLeaseSerializer

    def get_queryset(self):
        """Filter leases by scope if accessed via nested route."""
        queryset = super().get_queryset()

        scope_pk = self.kwargs.get("scope_pk")
        if scope_pk:
            queryset = queryset.filter(scope_id=scope_pk)

        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    @action(detail=True, methods=["post"])
    def release(self, request: Request, pk=None) -> Response:
        """Release a DHCP lease."""
        from ..services.dhcp import release_lease

        lease = self.get_object()
        release_lease(lease.id)

        serializer = self.get_serializer(lease)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"])
    def expire_all(self, request: Request) -> Response:
        """Expire all expired leases."""
        from ..services.dhcp import expire_leases

        count = expire_leases()
        return Response(
            {"expired_count": count},
            status=status.HTTP_200_OK,
        )


class DHCPReservationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing DHCP reservations.

    Provides endpoints for creating, viewing, and managing DHCP reservations.
    """

    queryset = DHCPReservation.objects.select_related("scope").all()
    serializer_class = DHCPReservationSerializer

    def get_queryset(self):
        """Filter reservations by scope if accessed via nested route."""
        queryset = super().get_queryset()

        scope_pk = self.kwargs.get("scope_pk")
        if scope_pk:
            queryset = queryset.filter(scope_id=scope_pk)

        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        return queryset

    @action(detail=False, methods=["get"])
    def statistics(self, request: Request) -> Response:
        """Get lease statistics."""
        from ..services.dhcp import get_lease_statistics

        scope_id = request.query_params.get("scope")
        stats = get_lease_statistics(int(scope_id) if scope_id else None)
        return Response(stats, status=status.HTTP_200_OK)


class DHCPOptionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing DHCP options.

    Provides endpoints for creating, viewing, and managing DHCP options.
    """

    queryset = DHCPOption.objects.select_related("scope").all()
    serializer_class = DHCPOptionSerializer

    def get_serializer_class(self):
        """Use create serializer for POST/PUT/PATCH requests."""
        if self.action in ["create", "update", "partial_update"]:
            return DHCPOptionCreateUpdateSerializer
        return DHCPOptionSerializer

    def get_queryset(self):
        """Filter options by scope if accessed via nested route."""
        queryset = super().get_queryset()

        scope_pk = self.kwargs.get("scope_pk")
        if scope_pk:
            queryset = queryset.filter(scope_id=scope_pk)

        option_code = self.request.query_params.get("option_code")
        if option_code:
            queryset = queryset.filter(option_code=option_code)

        return queryset
