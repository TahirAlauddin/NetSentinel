"""
IPAM (IP Address Management) ViewSets.

This module provides REST API endpoints for managing IP address space,
subnets, VLANs, VRFs, DNS zones, DNS records, and customer assignments.
All ViewSets support full CRUD operations and follow Django REST Framework patterns.
"""

from django.db import IntegrityError
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import (
    VLAN,
    VRF,
    Customer,
    DHCPLease,
    DHCPReservation,
    DHCPScope,
    DNSRecord,
    DNSZone,
    FavoriteSubnet,
    IPAddress,
    IPPool,
    IPRequest,
    NetworkScan,
    PhoneNumberRange,
    ScanResult,
    Subnet,
    SubnetGroup,
)
from ..serializers import (
    CustomerSerializer,
    DHCPLeaseCreateSerializer,
    DHCPLeaseSerializer,
    DHCPReservationSerializer,
    DHCPScopeCreateUpdateSerializer,
    DHCPScopeSerializer,
    DNSRecordSerializer,
    DNSZoneSerializer,
    IPAddressSerializer,
    IPPoolCreateUpdateSerializer,
    IPPoolSerializer,
    IPRequestCreateSerializer,
    IPRequestSerializer,
    NetworkScanCreateSerializer,
    NetworkScanSerializer,
    PhoneNumberRangeCreateUpdateSerializer,
    PhoneNumberRangeSerializer,
    ScanResultDetailSerializer,
    ScanResultSerializer,
    SubnetGroupSerializer,
    SubnetSerializer,
    VLANSerializer,
    VRFSerializer,
)
from .device_views import DeviceTypeViewSet, DeviceViewSet, RackViewSet
from .dhcp_views import (
    DHCPLeaseViewSet,
    DHCPOptionViewSet,
    DHCPReservationViewSet,
    DHCPScopeViewSet,
)
from .ip_audit_log_views import IPAuditLogFilterViewSet, IPAuditLogViewSet
from .ip_note_views import IPNoteAttachmentViewSet, IPNoteCommentViewSet, IPNoteViewSet
from .ip_tag_views import IPAddressTagViewSet, IPTagViewSet
from .subnet_threshold_views import SubnetThresholdAlertViewSet, SubnetThresholdViewSet


class CustomerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing customer profiles.

    Provides CRUD operations for customer records used in IPAM.
    Customers can be assigned to subnets for tracking ownership and billing.

    Endpoints:
    - GET /api/v1/ipam/customers/ - List all customers
    - POST /api/v1/ipam/customers/ - Create a new customer
    - GET /api/v1/ipam/customers/{id}/ - Retrieve a customer
    - PUT/PATCH /api/v1/ipam/customers/{id}/ - Update a customer
    - DELETE /api/v1/ipam/customers/{id}/ - Delete a customer
    """

    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer


class SubnetGroupViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing subnet groups.

    Subnet groups are used to organize subnets into logical collections
    (e.g., "Production Networks", "DMZ", "Internal Networks").

    Endpoints:
    - GET /api/v1/ipam/subnet-groups/ - List all subnet groups
    - POST /api/v1/ipam/subnet-groups/ - Create a new subnet group
    - GET /api/v1/ipam/subnet-groups/{id}/ - Retrieve a subnet group
    - PUT/PATCH /api/v1/ipam/subnet-groups/{id}/ - Update a subnet group
    - DELETE /api/v1/ipam/subnet-groups/{id}/ - Delete a subnet group
    """

    queryset = SubnetGroup.objects.all()
    serializer_class = SubnetGroupSerializer


class VLANViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing VLANs (Virtual LANs).

    VLANs represent network segmentation at Layer 2.
    Each VLAN is associated with a location and has a unique VLAN ID (1-4094).

    Endpoints:
    - GET /api/v1/ipam/vlans/ - List all VLANs
    - POST /api/v1/ipam/vlans/ - Create a new VLAN
    - GET /api/v1/ipam/vlans/{id}/ - Retrieve a VLAN
    - PUT/PATCH /api/v1/ipam/vlans/{id}/ - Update a VLAN
    - DELETE /api/v1/ipam/vlans/{id}/ - Delete a VLAN
    """

    queryset = VLAN.objects.select_related("location").all()
    serializer_class = VLANSerializer


class VRFViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing VRFs (Virtual Routing and Forwarding).

    VRFs provide Layer 3 network isolation and routing separation.
    Each VRF can have an optional Route Distinguisher (RD) for MPLS/VPN scenarios.

    Endpoints:
    - GET /api/v1/ipam/vrfs/ - List all VRFs
    - POST /api/v1/ipam/vrfs/ - Create a new VRF
    - GET /api/v1/ipam/vrfs/{id}/ - Retrieve a VRF
    - PUT/PATCH /api/v1/ipam/vrfs/{id}/ - Update a VRF
    - DELETE /api/v1/ipam/vrfs/{id}/ - Delete a VRF
    """

    queryset = VRF.objects.select_related("location").all()
    serializer_class = VRFSerializer


class PhoneNumberRangeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing phone number ranges.

    Provides CRUD operations for phone number ranges with carrier, trunk, and location information.

    Endpoints:
    - GET /api/v1/ipam/phone-numbers/ - List all phone number ranges
    - POST /api/v1/ipam/phone-numbers/ - Create a new phone number range
    - GET /api/v1/ipam/phone-numbers/{id}/ - Retrieve a phone number range
    - PUT/PATCH /api/v1/ipam/phone-numbers/{id}/ - Update a phone number range
    - DELETE /api/v1/ipam/phone-numbers/{id}/ - Delete a phone number range
    """

    queryset = PhoneNumberRange.objects.select_related("location").all()
    serializer_class = PhoneNumberRangeSerializer

    def get_serializer_class(self):
        """Use create/update serializer for POST/PUT/PATCH requests."""
        if self.action in ["create", "update", "partial_update"]:
            return PhoneNumberRangeCreateUpdateSerializer
        return PhoneNumberRangeSerializer

    def get_queryset(self):
        """Filter by location or carrier if provided."""
        queryset = super().get_queryset()

        location_id = self.request.query_params.get("location")
        if location_id:
            queryset = queryset.filter(location_id=location_id)

        carrier = self.request.query_params.get("carrier")
        if carrier:
            queryset = queryset.filter(carrier__icontains=carrier)

        return queryset


class IPPoolViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing IP address pools.

    Provides CRUD operations for IP pools within subnets.
    """

    queryset = IPPool.objects.select_related("subnet").all()
    serializer_class = IPPoolSerializer

    def get_serializer_class(self):
        """Use create/update serializer for POST/PUT/PATCH requests."""
        if self.action in ["create", "update", "partial_update"]:
            return IPPoolCreateUpdateSerializer
        return IPPoolSerializer

    def get_queryset(self):
        """Filter by subnet if provided."""
        queryset = super().get_queryset()

        subnet_id = self.request.query_params.get("subnet")
        if subnet_id:
            queryset = queryset.filter(subnet_id=subnet_id)

        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        return queryset

    @action(detail=True, methods=["get"])
    def utilization(self, request, pk=None):
        """Get pool utilization statistics."""
        from ..services.ip_pool import get_pool_utilization

        pool = self.get_object()
        utilization = get_pool_utilization(pool.id)
        return Response(utilization, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def assign_ip(self, request, pk=None):
        """Assign an IP address from the pool."""
        from ..serializers import IPAddressSerializer
        from ..services.ip_pool import assign_ip_from_pool

        pool = self.get_object()
        description = request.data.get("description")

        ip_address = assign_ip_from_pool(pool.id, description)

        if ip_address:
            serializer = IPAddressSerializer(ip_address)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(
                {"error": "No available IPs in pool"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=False, methods=["get"])
    def utilization_all(self, request):
        """Get utilization for all pools."""
        from ..services.ip_pool import get_all_pools_utilization

        subnet_id = request.query_params.get("subnet")
        utilization = get_all_pools_utilization(int(subnet_id) if subnet_id else None)
        return Response(utilization, status=status.HTTP_200_OK)


class SubnetViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing IP subnets.

    Subnets represent IP address ranges in CIDR notation (IPv4 or IPv6).
    Supports hierarchical subnet relationships through master_subnet field.
    Subnets can be associated with VLANs, VRFs, locations, groups, and customers.

    Endpoints:
    - GET /api/v1/ipam/subnets/ - List all subnets
    - POST /api/v1/ipam/subnets/ - Create a new subnet
    - GET /api/v1/ipam/subnets/{id}/ - Retrieve a subnet
    - PUT/PATCH /api/v1/ipam/subnets/{id}/ - Update a subnet
    - DELETE /api/v1/ipam/subnets/{id}/ - Delete a subnet
    - GET /api/v1/ipam/subnets/{id}/child_subnets/ - Get child subnets
    - GET /api/v1/ipam/subnets/{id}/ip_addresses/ - Get IP addresses in subnet
    """

    queryset = (
        Subnet.objects.select_related(
            "group", "location", "vlan", "vrf", "master_subnet", "customer"
        )
        .prefetch_related("child_subnets", "ip_addresses")
        .all()
    )
    serializer_class = SubnetSerializer

    def get_queryset(self):
        """
        Annotate queryset with favorite status for the current user.
        """
        queryset = super().get_queryset()
        user = self.request.user

        if user and user.is_authenticated:
            # Annotate with favorite status
            from django.db.models import Exists, OuterRef

            from ..models import FavoriteSubnet

            queryset = queryset.annotate(
                is_favorite=Exists(FavoriteSubnet.objects.filter(user=user, subnet=OuterRef("pk")))
            )
        else:
            # For anonymous users, set is_favorite to False
            from django.db.models import BooleanField, Value

            queryset = queryset.annotate(is_favorite=Value(False, output_field=BooleanField()))

        return queryset

    @action(detail=True, methods=["get"])
    def child_subnets(self, request, pk=None):
        """
        Retrieve all child subnets for a given subnet.

        Args:
            request: HTTP request object
            pk: Primary key of the subnet

        Returns:
            Response containing serialized list of child subnets
        """
        subnet = self.get_object()
        child_subnets = subnet.child_subnets.all()
        serializer = SubnetSerializer(child_subnets, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def ip_addresses(self, request, pk=None):
        """
        Retrieve all IP addresses assigned to a subnet.

        Args:
            request: HTTP request object
            pk: Primary key of the subnet

        Returns:
            Response containing serialized list of IP addresses
        """
        subnet = self.get_object()
        ip_addresses = subnet.ip_addresses.all()
        serializer = IPAddressSerializer(ip_addresses, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="auto-assign")
    def auto_assign(self, request, pk=None):
        """
        Automatically assign the next available IP address from this subnet to an asset.

        POST /api/v1/ipam/subnets/{id}/auto-assign/
        Body: {
            "asset_id": <asset_id>,
            "reason": "optional reason",
            "notes": "optional notes"
        }
        """
        from assets.models import Asset

        from ..serializers import IPAddressSerializer
        from ..services.ip_assignment import auto_assign_ip_from_subnet

        subnet = self.get_object()
        asset_id = request.data.get("asset_id")

        if not asset_id:
            return Response(
                {"error": "asset_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            asset = Asset.objects.get(id=asset_id)
        except Asset.DoesNotExist:
            return Response(
                {"error": f"Asset with id {asset_id} not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            ip_address, history = auto_assign_ip_from_subnet(
                subnet=subnet,
                asset=asset,
                assigned_by=request.user,
                reason=request.data.get("reason"),
                notes=request.data.get("notes"),
            )
            serializer = IPAddressSerializer(ip_address)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=["get"])
    def utilization(self, request, pk=None):
        """
        Get utilization statistics for a subnet.

        GET /api/v1/ipam/subnets/{id}/utilization/
        """
        from ..services.subnet_utilization import calculate_subnet_utilization

        subnet = self.get_object()
        utilization = calculate_subnet_utilization(subnet)
        return Response(utilization, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def capacity(self, request, pk=None):
        """
        Get capacity planning data for a subnet.

        GET /api/v1/ipam/subnets/{id}/capacity/?growth_rate=0.05&months=12
        Query params:
            growth_rate: Monthly growth rate as decimal (default: 0.0)
            months: Number of months to project (default: 12)
        """
        from ..services.subnet_utilization import calculate_subnet_capacity

        subnet = self.get_object()
        growth_rate = float(request.query_params.get("growth_rate", 0.0))
        months = int(request.query_params.get("months", 12))

        capacity = calculate_subnet_capacity(subnet, growth_rate=growth_rate, months=months)
        return Response(capacity, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="utilization_all")
    def utilization_all(self, request):
        """
        Get utilization for all subnets with optional filters.

        GET /api/v1/ipam/subnets/utilization/?location=1&threshold=75
        Query params:
            location: Filter by location ID
            group: Filter by subnet group ID
            status: Filter by subnet status
            is_ipv6: Filter by IPv6 (true/false)
            threshold: Minimum utilization percentage to include
        """
        from ..services.subnet_utilization import get_all_subnets_utilization

        filters = {}
        if "location" in request.query_params:
            filters["location"] = request.query_params["location"]
        if "group" in request.query_params:
            filters["group"] = request.query_params["group"]
        if "status" in request.query_params:
            filters["status"] = request.query_params["status"]
        if "is_ipv6" in request.query_params:
            filters["is_ipv6"] = request.query_params["is_ipv6"].lower() == "true"

        threshold = None
        if "threshold" in request.query_params:
            threshold = float(request.query_params["threshold"])

        utilizations = get_all_subnets_utilization(filters=filters, threshold=threshold)
        return Response(utilizations, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="utilization_summary")
    def utilization_summary(self, request):
        """
        Get overall utilization summary across all subnets.

        GET /api/v1/ipam/subnets/utilization/summary/
        """
        from ..services.subnet_utilization import get_utilization_summary

        summary = get_utilization_summary()
        return Response(summary, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post", "delete"])
    def favorite(self, request, pk=None):
        """
        Add or remove a subnet from user's favorites.

        POST /api/v1/ipam/subnets/{id}/favorite/ - Add to favorites
        DELETE /api/v1/ipam/subnets/{id}/favorite/ - Remove from favorites

        Args:
            request: HTTP request object
            pk: Primary key of the subnet

        Returns:
            Response containing updated subnet with is_favorite status
        """
        subnet = self.get_object()
        user = request.user

        if request.method == "POST":
            # Add to favorites
            favorite, created = FavoriteSubnet.objects.get_or_create(user=user, subnet=subnet)
            if created:
                serializer = SubnetSerializer(subnet)
                # Add is_favorite field to response
                data = serializer.data
                data["is_favorite"] = True
                return Response(data, status=status.HTTP_201_CREATED)
            else:
                # Already favorited
                serializer = SubnetSerializer(subnet)
                data = serializer.data
                data["is_favorite"] = True
                return Response(data, status=status.HTTP_200_OK)
        elif request.method == "DELETE":
            # Remove from favorites
            deleted_count, _ = FavoriteSubnet.objects.filter(user=user, subnet=subnet).delete()

            serializer = SubnetSerializer(subnet)
            data = serializer.data
            data["is_favorite"] = False
            return Response(data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="duplicates")
    def duplicate_subnets(self, request):
        """
        Detect duplicate or overlapping subnets.

        GET /api/v1/ipam/subnets/duplicates/
        """
        from ..services.duplicates_detection import detect_duplicate_subnets

        duplicates = detect_duplicate_subnets()
        return Response(duplicates, status=status.HTTP_200_OK)


class IPAddressViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing individual IP addresses.

    Supports both standalone access and nested access under subnets.
    When accessed via nested route, automatically filters and assigns to parent subnet.

    Endpoints:
    - GET /api/v1/ipam/ip-addresses/ - List all IP addresses
    - POST /api/v1/ipam/ip-addresses/ - Create a new IP address
    - GET /api/v1/ipam/ip-addresses/{id}/ - Retrieve an IP address
    - PUT/PATCH /api/v1/ipam/ip-addresses/{id}/ - Update an IP address
    - DELETE /api/v1/ipam/ip-addresses/{id}/ - Delete an IP address
    - GET /api/v1/ipam/subnets/{id}/ip-addresses/ - List IPs in a subnet (nested)
    - POST /api/v1/ipam/subnets/{id}/ip-addresses/ - Create IP in a subnet (nested)
    - POST /api/v1/ipam/ip-addresses/{id}/assign/ - Assign IP to asset
    - POST /api/v1/ipam/ip-addresses/{id}/release/ - Release IP from asset
    - POST /api/v1/ipam/subnets/{id}/auto-assign/ - Auto-assign IP from subnet to asset
    - GET /api/v1/ipam/ip-addresses/{id}/history/ - Get assignment history
    - POST /api/v1/ipam/ip-addresses/import/ - Import IP addresses from CSV/JSON
    - GET /api/v1/ipam/ip-addresses/export/ - Export IP addresses to CSV/JSON
    """

    queryset = IPAddress.objects.select_related("subnet", "assigned_to_asset", "assigned_by").all()
    serializer_class = IPAddressSerializer

    def get_queryset(self):
        """
        Filter queryset when accessed through nested router.

        When accessed via nested route (/subnets/{id}/ip-addresses/),
        automatically filters to show only IP addresses belonging to that subnet.

        Returns:
            Filtered queryset based on route context
        """
        queryset = super().get_queryset()
        # Filter by subnet when accessed via nested route: /subnets/{id}/ip-addresses/
        subnet_pk = self.kwargs.get("subnet_pk")
        if subnet_pk:
            queryset = queryset.filter(subnet_id=subnet_pk)

        # Filter by asset if provided
        asset_id = self.request.query_params.get("assigned_to_asset")
        if asset_id:
            queryset = queryset.filter(assigned_to_asset_id=asset_id)

        # Filter by status if provided
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset

    def perform_create(self, serializer):
        """
        Set subnet when creating via nested route and log the action.

        Automatically assigns the IP address to the parent subnet
        when created through the nested endpoint.

        Args:
            serializer: Serializer instance with validated data
        """
        subnet_pk = self.kwargs.get("subnet_pk")
        if subnet_pk:
            ip_address = serializer.save(subnet_id=subnet_pk)
        else:
            ip_address = serializer.save()

        # Log the creation
        from ..services.ip_audit_log import log_ip_action

        log_ip_action(
            ip_address=ip_address,
            action="created",
            user=self.request.user,
            reason="IP address created via API",
        )

    def perform_update(self, serializer):
        """Update IP address and log changes."""
        old_instance = self.get_object()
        old_data = {
            "status": old_instance.status,
            "description": old_instance.description,
            "subnet": old_instance.subnet.id if old_instance.subnet else None,
        }

        ip_address = serializer.save()

        # Log changes
        from ..services.ip_audit_log import log_ip_action

        # Check what changed
        if old_data["status"] != ip_address.status:
            log_ip_action(
                ip_address=ip_address,
                action="status_changed",
                user=self.request.user,
                field_name="status",
                old_value=old_data["status"],
                new_value=ip_address.status,
            )

        if old_data["description"] != ip_address.description:
            log_ip_action(
                ip_address=ip_address,
                action="description_changed",
                user=self.request.user,
                field_name="description",
                old_value=old_data["description"] or "",
                new_value=ip_address.description or "",
            )

        if old_data["subnet"] != (ip_address.subnet.id if ip_address.subnet else None):
            log_ip_action(
                ip_address=ip_address,
                action="subnet_changed",
                user=self.request.user,
                field_name="subnet",
                old_value=str(old_data["subnet"]) if old_data["subnet"] else "",
                new_value=str(ip_address.subnet.id) if ip_address.subnet else "",
            )

        # General update log
        log_ip_action(
            ip_address=ip_address,
            action="updated",
            user=self.request.user,
        )

    def perform_destroy(self, instance):
        """Delete IP address and log the deletion."""
        from ..services.ip_audit_log import log_ip_action

        # Log before deletion
        log_ip_action(
            ip_address=instance,
            action="deleted",
            user=self.request.user,
            metadata={
                "ip_address": instance.address,
                "subnet_id": instance.subnet.id if instance.subnet else None,
                "subnet_network": instance.subnet.network if instance.subnet else None,
                "status": instance.status,
            },
        )

        instance.delete()

    @action(detail=True, methods=["post"])
    def assign(self, request, pk=None):
        """
        Assign an IP address to an asset.

        POST /api/v1/ipam/ip-addresses/{id}/assign/
        Body: {
            "asset_id": <asset_id>,
            "reason": "optional reason",
            "notes": "optional notes"
        }
        """
        from assets.models import Asset

        from ..services.ip_assignment import assign_ip_to_asset

        ip_address = self.get_object()
        asset_id = request.data.get("asset_id")

        if not asset_id:
            return Response(
                {"error": "asset_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            asset = Asset.objects.get(id=asset_id)
        except Asset.DoesNotExist:
            return Response(
                {"error": f"Asset with id {asset_id} not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            assign_ip_to_asset(
                ip_address=ip_address,
                asset=asset,
                assigned_by=request.user,
                reason=request.data.get("reason"),
                notes=request.data.get("notes"),
            )
            serializer = self.get_serializer(ip_address)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=["post"])
    def release(self, request, pk=None):
        """
        Release an IP address from its current asset assignment.

        POST /api/v1/ipam/ip-addresses/{id}/release/
        Body: {
            "reason": "optional reason",
            "notes": "optional notes",
            "new_status": "available" (default) or "reserved" or "deprecated"
        }
        """
        from ..services.ip_assignment import release_ip_from_asset

        ip_address = self.get_object()
        new_status = request.data.get("new_status", "available")

        try:
            release_ip_from_asset(
                ip_address=ip_address,
                released_by=request.user,
                reason=request.data.get("reason"),
                notes=request.data.get("notes"),
                new_status=new_status,
            )
            serializer = self.get_serializer(ip_address)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=["get"])
    def history(self, request, pk=None):
        """
        Get assignment history for an IP address.

        GET /api/v1/ipam/ip-addresses/{id}/history/
        """
        from ..models import IPAssignmentHistory
        from ..serializers import IPAssignmentHistorySerializer

        ip_address = self.get_object()
        history = IPAssignmentHistory.objects.filter(ip_address=ip_address).order_by(
            "-created_at", "-id"
        )

        serializer = IPAssignmentHistorySerializer(history, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def search(self, request):
        """
        Advanced search for IP addresses.

        GET /api/v1/ipam/ip-addresses/search/?q=192.168.1&status=assigned&subnet=1
        Query params:
            q: Search query (IP, description, or asset name)
            status: Filter by status
            subnet: Filter by subnet ID
            assigned_to_asset: Filter by asset ID
            customer: Filter by customer ID (via subnet)
            location: Filter by location ID (via subnet)
            is_ipv6: Filter by IPv4/IPv6 (true/false)
            vlan: Filter by VLAN ID (via subnet)
            vrf: Filter by VRF ID (via subnet)
        """
        from ..serializers import IPAddressSerializer
        from ..services.ip_search import search_ip_addresses

        filters = {}
        if "vlan" in request.query_params:
            filters["vlan_id"] = request.query_params["vlan"]
        if "vrf" in request.query_params:
            filters["vrf_id"] = request.query_params["vrf"]

        results = search_ip_addresses(
            query=request.query_params.get("q"),
            filters=filters,
            subnet_id=request.query_params.get("subnet"),
            status=request.query_params.get("status"),
            assigned_to_asset=request.query_params.get("assigned_to_asset"),
            customer_id=request.query_params.get("customer"),
            location_id=request.query_params.get("location"),
            is_ipv6=(
                request.query_params.get("is_ipv6") == "true"
                if "is_ipv6" in request.query_params
                else None
            ),
        )

        serializer = IPAddressSerializer(results, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="range")
    def range_search(self, request):
        """
        Search for IP addresses within a range.

        GET /api/v1/ipam/ip-addresses/range/?start=192.168.1.1&end=192.168.1.100&subnet=1
        Query params:
            start: Starting IP address
            end: Ending IP address
            subnet: Optional subnet ID filter
        """
        from ..serializers import IPAddressSerializer
        from ..services.ip_search import search_ip_range

        start_ip = request.query_params.get("start")
        end_ip = request.query_params.get("end")

        if not start_ip or not end_ip:
            return Response(
                {"error": "start and end IP addresses are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        subnet_id = request.query_params.get("subnet")
        results = search_ip_range(
            start_ip=start_ip,
            end_ip=end_ip,
            subnet_id=int(subnet_id) if subnet_id else None,
        )

        serializer = IPAddressSerializer(results, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="hostname")
    def search_by_hostname(self, request):
        """
        Search for IP addresses by hostname/DNS name.

        GET /api/v1/ipam/ip-addresses/hostname/?hostname=server1.example.com
        Query params:
            hostname: Hostname or FQDN to search for
        """
        from ..serializers import IPAddressSerializer
        from ..services.ip_search import search_by_hostname

        hostname = request.query_params.get("hostname")
        if not hostname:
            return Response(
                {"error": "hostname parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        results = search_by_hostname(hostname)
        serializer = IPAddressSerializer(results, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="reverse-dns")
    def reverse_dns_lookup(self, request):
        """
        Perform reverse DNS lookup for an IP address.

        GET /api/v1/ipam/ip-addresses/reverse-dns/?ip=192.168.1.1
        Query params:
            ip: IP address to lookup

        Returns:
            {
                "ip_address": "192.168.1.1",
                "hostname": "server.example.com" or null,
                "found": true/false
            }
        """
        import ipaddress

        from ..services.network_scanning import reverse_dns_lookup

        ip = request.query_params.get("ip")
        if not ip:
            return Response(
                {"error": "ip parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate IP address
        try:
            ipaddress.ip_address(ip)
        except ValueError:
            return Response(
                {"error": f"Invalid IP address: {ip}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        hostname = reverse_dns_lookup(ip)
        return Response(
            {
                "ip_address": ip,
                "hostname": hostname,
                "found": hostname is not None,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"])
    def import_addresses(self, request):
        """
        Import IP addresses from CSV or JSON.

        POST /api/v1/ipam/ip-addresses/import/
        Body (multipart/form-data):
            file: CSV or JSON file
            format: "csv" or "json" (optional, auto-detected from file extension)
            skip_duplicates: true/false (default: true)

        Returns:
            {
                "valid_rows": <count>,
                "errors": <list of validation errors>,
                "results": {
                    "created": <count>,
                    "updated": <count>,
                    "skipped": <count>,
                    "errors": <list of import errors>
                }
            }
        """
        from ..services.ip_import_export import (
            IPImportError,
            import_ip_addresses,
            parse_csv_import,
            parse_json_import,
            validate_import_data,
        )

        if "file" not in request.FILES:
            return Response(
                {"error": "No file provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        file = request.FILES["file"]
        file_format = request.data.get("format", "").lower()
        skip_duplicates = request.data.get("skip_duplicates", "true").lower() == "true"

        # Auto-detect format from file extension if not provided
        if not file_format:
            filename = file.name.lower()
            if filename.endswith(".csv"):
                file_format = "csv"
            elif filename.endswith(".json"):
                file_format = "json"
            else:
                return Response(
                    {"error": "Unsupported file format. Use CSV or JSON."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            # Read file content
            content = file.read().decode("utf-8")

            # Parse based on format
            if file_format == "csv":
                rows = parse_csv_import(content)
            elif file_format == "json":
                rows = parse_json_import(content)
            else:
                return Response(
                    {"error": f"Unsupported format: {file_format}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Validate data
            valid_rows, validation_errors = validate_import_data(rows)

            # Import valid rows
            import_results = import_ip_addresses(
                valid_rows,
                created_by=request.user,
                skip_duplicates=skip_duplicates,
            )

            return Response(
                {
                    "valid_rows": len(valid_rows),
                    "total_rows": len(rows),
                    "validation_errors": validation_errors,
                    "results": import_results,
                },
                status=status.HTTP_200_OK,
            )

        except IPImportError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": f"Import failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=["get"])
    def export_addresses(self, request):
        """
        Export IP addresses to CSV or JSON.

        GET /api/v1/ipam/ip-addresses/export/?format=csv&status=assigned&subnet=1
        Query params:
            format: "csv" or "json" (default: csv)
            status: Filter by status
            subnet: Filter by subnet ID
            assigned_to_asset: Filter by asset ID
            customer: Filter by customer ID (via subnet)
            location: Filter by location ID (via subnet)

        Returns:
            CSV or JSON file download
        """
        from ..services.ip_import_export import (
            export_ip_addresses_to_csv,
            export_ip_addresses_to_json,
        )

        # Get filtered queryset
        queryset = self.get_queryset()

        # Apply additional filters
        status_filter = request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        subnet_id = request.query_params.get("subnet")
        if subnet_id:
            queryset = queryset.filter(subnet_id=subnet_id)

        asset_id = request.query_params.get("assigned_to_asset")
        if asset_id:
            queryset = queryset.filter(assigned_to_asset_id=asset_id)

        # Convert queryset to list
        ip_addresses = list(queryset)

        # Get format
        file_format = request.query_params.get("format", "csv").lower()

        if file_format == "csv":
            content = export_ip_addresses_to_csv(ip_addresses)
            content_type = "text/csv"
            filename = "ip_addresses_export.csv"
        elif file_format == "json":
            content = export_ip_addresses_to_json(ip_addresses)
            content_type = "application/json"
            filename = "ip_addresses_export.json"
        else:
            return Response(
                {"error": f"Unsupported format: {file_format}. Use 'csv' or 'json'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.http import HttpResponse

        response = HttpResponse(content, content_type=content_type)
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response

    @action(detail=False, methods=["get"], url_path="(?P<ip_address>[^/]+)/details")
    def ip_details(self, request, ip_address=None):
        """
        Get comprehensive details for an IP address.

        GET /api/v1/ipam/ip-addresses/{ip_address}/details/
        """
        from ..services.ip_search import get_ip_details

        if not ip_address:
            return Response(
                {"error": "IP address is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        details = get_ip_details(ip_address)
        return Response(details, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="(?P<ip_address>[^/]+)/conflicts")
    def ip_conflicts(self, request, ip_address=None):
        """
        Detect IP address conflicts across subnets.

        GET /api/v1/ipam/ip-addresses/{ip_address}/conflicts/?exclude_subnet=1
        Query params:
            exclude_subnet: Optional subnet ID to exclude from conflict check
        """
        from ..services.ip_search import detect_ip_conflicts

        if not ip_address:
            return Response(
                {"error": "IP address is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        exclude_subnet_id = request.query_params.get("exclude_subnet")
        conflicts = detect_ip_conflicts(
            ip_address=ip_address,
            exclude_subnet_id=int(exclude_subnet_id) if exclude_subnet_id else None,
        )

        return Response(conflicts, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="find-available")
    def find_available(self, request):
        """
        Find available IP addresses in a subnet.

        GET /api/v1/ipam/ip-addresses/find-available/?subnet=1&count=10
        Query params:
            subnet: Subnet ID (required)
            count: Number of available IPs to find (default: 10)
        """
        from ..services.ip_search import find_available_ips_in_subnet

        subnet_id = request.query_params.get("subnet")
        if not subnet_id:
            return Response(
                {"error": "subnet parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        count = int(request.query_params.get("count", 10))
        available = find_available_ips_in_subnet(
            subnet_id=int(subnet_id),
            count=count,
        )

        return Response({"available_ips": available}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="inactive-hosts")
    def inactive_hosts(self, request):
        """
        Get list of inactive IP addresses.

        GET /api/v1/ipam/ip-addresses/inactive-hosts/?threshold_days=90&status=assigned&subnet=1
        Query params:
            threshold_days: Number of days since last update to consider inactive (default: 90)
            status: Filter by IP status
            subnet: Filter by subnet ID
        """
        from ..serializers import IPAddressSerializer
        from ..services.inactive_hosts import detect_inactive_hosts

        threshold_days = int(request.query_params.get("threshold_days", 90))
        status_filter = request.query_params.get("status")
        subnet_id = request.query_params.get("subnet")

        inactive = detect_inactive_hosts(
            threshold_days=threshold_days,
            status_filter=status_filter,
            subnet_id=int(subnet_id) if subnet_id else None,
        )

        serializer = IPAddressSerializer(inactive, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="inactive-hosts/summary")
    def inactive_hosts_summary(self, request):
        """
        Get summary statistics for inactive hosts.

        GET /api/v1/ipam/ip-addresses/inactive-hosts/summary/?threshold_days=90
        Query params:
            threshold_days: Number of days since last update to consider inactive (default: 90)
        """
        from ..services.inactive_hosts import get_inactive_hosts_summary

        threshold_days = int(request.query_params.get("threshold_days", 90))
        summary = get_inactive_hosts_summary(threshold_days=threshold_days)
        return Response(summary, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="inactive-hosts/bulk-release")
    def bulk_release_inactive(self, request):
        """
        Bulk release inactive IP addresses.

        POST /api/v1/ipam/ip-addresses/inactive-hosts/bulk-release/
        Body:
            {
                "ip_ids": [1, 2, 3],
                "release_reason": "Inactive host cleanup"
            }
        """
        from ..services.inactive_hosts import bulk_release_inactive_hosts

        ip_ids = request.data.get("ip_ids", [])
        release_reason = request.data.get("release_reason", "Inactive host cleanup")

        if not ip_ids:
            return Response(
                {"error": "ip_ids is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        results = bulk_release_inactive_hosts(ip_ids, release_reason)
        return Response(results, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="inactive-hosts/bulk-deprecate")
    def bulk_deprecate_inactive(self, request):
        """
        Bulk mark inactive IP addresses as deprecated.

        POST /api/v1/ipam/ip-addresses/inactive-hosts/bulk-deprecate/
        Body:
            {
                "ip_ids": [1, 2, 3],
                "reason": "Inactive host"
            }
        """
        from ..services.inactive_hosts import bulk_mark_deprecated

        ip_ids = request.data.get("ip_ids", [])
        reason = request.data.get("reason", "Inactive host")

        if not ip_ids:
            return Response(
                {"error": "ip_ids is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        results = bulk_mark_deprecated(ip_ids, reason)
        return Response(results, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="duplicates")
    def duplicates(self, request):
        """
        Detect duplicate IP addresses.

        GET /api/v1/ipam/ip-addresses/duplicates/
        """
        from ..services.duplicates_detection import detect_duplicate_ips

        duplicates = detect_duplicate_ips()
        return Response(duplicates, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="duplicates/summary")
    def duplicates_summary(self, request):
        """
        Get summary of all duplicates (IPs and subnets).

        GET /api/v1/ipam/ip-addresses/duplicates/summary/
        """
        from ..services.duplicates_detection import get_duplicates_summary

        summary = get_duplicates_summary()
        return Response(summary, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="duplicates/resolve")
    def resolve_duplicate(self, request):
        """
        Resolve duplicate IP addresses.

        POST /api/v1/ipam/ip-addresses/duplicates/resolve/
        Body:
            {
                "address": "192.168.1.1",
                "ip_to_keep": 1,
                "ips_to_remove": [2, 3]
            }
        """
        from ..services.duplicates_detection import resolve_duplicate

        address = request.data.get("address")
        ip_to_keep = request.data.get("ip_to_keep")
        ips_to_remove = request.data.get("ips_to_remove", [])

        if not address or ip_to_keep is None:
            return Response(
                {"error": "address and ip_to_keep are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        results = resolve_duplicate(address, ip_to_keep, ips_to_remove)
        return Response(results, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="duplicates/suggest")
    def suggest_duplicate_resolution(self, request):
        """
        Get resolution suggestions for a duplicate IP address.

        GET /api/v1/ipam/ip-addresses/duplicates/suggest/?address=192.168.1.1
        Query params:
            address: IP address to get suggestions for
        """
        from ..services.duplicates_detection import detect_duplicate_ips, suggest_resolution

        address = request.query_params.get("address")
        if not address:
            return Response(
                {"error": "address parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        duplicates = detect_duplicate_ips()
        duplicate_info = next((dup for dup in duplicates if dup["address"] == address), None)

        if not duplicate_info:
            return Response(
                {"error": f"No duplicates found for {address}"},
                status=status.HTTP_404_NOT_FOUND,
            )

        suggestion = suggest_resolution(duplicate_info)
        return Response(suggestion, status=status.HTTP_200_OK)


class DNSZoneViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing DNS zones.

    DNS zones represent domain namespaces (e.g., example.com).
    Each zone can contain multiple DNS records (A, AAAA, CNAME, MX, etc.).

    Endpoints:
    - GET /api/v1/ipam/dns-zones/ - List all DNS zones
    - POST /api/v1/ipam/dns-zones/ - Create a new DNS zone
    - GET /api/v1/ipam/dns-zones/{id}/ - Retrieve a DNS zone
    - PUT/PATCH /api/v1/ipam/dns-zones/{id}/ - Update a DNS zone
    - DELETE /api/v1/ipam/dns-zones/{id}/ - Delete a DNS zone
    - GET /api/v1/ipam/dns-zones/{id}/records/ - Get all records in a zone
    """

    queryset = DNSZone.objects.select_related("location").prefetch_related("records").all()
    serializer_class = DNSZoneSerializer

    # Note: The 'records' endpoint is handled by the nested router in urls.py
    # This allows both GET and POST operations via /dns-zones/{id}/records/


class DNSRecordViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing DNS records.

    DNS records represent individual entries within a DNS zone.
    Supports multiple record types: A, AAAA, CNAME, MX, TXT, NS, PTR, SRV.
    Supports both standalone access and nested access under DNS zones.

    Endpoints:
    - GET /api/v1/ipam/dns-records/ - List all DNS records
    - POST /api/v1/ipam/dns-records/ - Create a new DNS record
    - GET /api/v1/ipam/dns-records/{id}/ - Retrieve a DNS record
    - PUT/PATCH /api/v1/ipam/dns-records/{id}/ - Update a DNS record
    - DELETE /api/v1/ipam/dns-records/{id}/ - Delete a DNS record
    - GET /api/v1/ipam/dns-zones/{id}/records/ - List records in a zone (nested)
    - POST /api/v1/ipam/dns-zones/{id}/records/ - Create record in a zone (nested)
    """

    queryset = DNSRecord.objects.select_related("zone").all()
    serializer_class = DNSRecordSerializer

    def get_queryset(self):
        """
        Filter queryset when accessed through nested router.

        When accessed via nested route (/dns-zones/{id}/records/),
        automatically filters to show only records belonging to that zone.

        Returns:
            Filtered queryset based on route context
        """
        zone_pk = self.kwargs.get("zone_pk")
        print(f"zone_pk: {zone_pk}")
        queryset = super().get_queryset()
        # Filter by zone when accessed via nested route: /dns-zones/{id}/records/
        if zone_pk:
            queryset = queryset.filter(zone_id=zone_pk)
        return queryset

    def get_serializer_context(self):
        """Add zone_pk to serializer context for nested routes."""
        context = super().get_serializer_context()
        zone_pk = self.kwargs.get("zone_pk")
        if zone_pk:
            # Convert to int if it's a string
            context["zone_pk"] = int(zone_pk) if isinstance(zone_pk, str) else zone_pk
        return context

    def create(self, request, *args, **kwargs):
        """
        Create a DNS record with proper error handling for duplicates.

        Catches IntegrityError when attempting to create a duplicate record
        and returns a 400 Bad Request response instead of raising an exception.

        Returns:
            Response: 201 Created on success, 400 Bad Request on duplicate
        """
        try:
            return super().create(request, *args, **kwargs)
        except IntegrityError as e:
            # Check if it's a unique constraint violation
            error_str = str(e).lower()
            if "unique constraint" in error_str or "duplicate" in error_str:
                return Response(
                    {
                        "error": (
                            "A DNS record with this combination of zone, name, "
                            "and record_type already exists."
                        ),
                        "detail": "Duplicate DNS records are not allowed within the same zone.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # Re-raise if it's a different IntegrityError
            raise

    def perform_create(self, serializer):
        """
        Set zone when creating via nested route.

        Automatically assigns the DNS record to the parent zone
        when created through the nested endpoint.

        Args:
            serializer: Serializer instance with validated data
        """
        zone_pk = self.kwargs.get("zone_pk")
        if zone_pk:
            # Convert to int if it's a string
            zone_pk = int(zone_pk) if isinstance(zone_pk, str) else zone_pk
            serializer.save(zone_id=zone_pk)
        else:
            serializer.save()


class IPRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing IP address reservation requests.

    Supports IP address reservation requests with approval workflow.
    Users can request IP addresses, which go through an approval process.
    Once approved, IP addresses are automatically created/updated.

    Endpoints:
    - GET /api/v1/ipam/ip-requests/ - List all IP requests
    - POST /api/v1/ipam/ip-requests/ - Create a new IP request
    - GET /api/v1/ipam/ip-requests/{id}/ - Retrieve an IP request
    - PUT/PATCH /api/v1/ipam/ip-requests/{id}/ - Update an IP request
    - DELETE /api/v1/ipam/ip-requests/{id}/ - Delete an IP request
    - POST /api/v1/ipam/ip-requests/{id}/approve/ - Approve an IP request
    - POST /api/v1/ipam/ip-requests/{id}/reject/ - Reject an IP request
    - GET /api/v1/ipam/subnets/{id}/ip-requests/ - List requests for a subnet (nested)
    - POST /api/v1/ipam/subnets/{id}/ip-requests/ - Create request for a subnet (nested)
    """

    queryset = IPRequest.objects.select_related(
        "requested_by", "approved_by", "subnet", "ip_address"
    ).all()
    serializer_class = IPRequestSerializer

    def get_queryset(self):
        """
        Filter queryset based on user and route context.

        - When accessed via nested route, filters by subnet
        - Users can only see their own requests unless they have admin permissions
        - Admins can see all requests
        """
        queryset = super().get_queryset()

        # Filter by subnet when accessed via nested route
        subnet_pk = self.kwargs.get("subnet_pk")
        if subnet_pk:
            queryset = queryset.filter(subnet_id=subnet_pk)

        # Filter by status if provided
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by user's own requests if not admin
        # Note: You may want to add permission checks here
        # For now, all authenticated users can see all requests
        # Uncomment below to restrict to own requests:
        # if not self.request.user.is_staff:
        #     queryset = queryset.filter(requested_by=self.request.user)

        return queryset

    def get_serializer_class(self):
        """Use create serializer for POST requests."""
        if self.action == "create":
            return IPRequestCreateSerializer
        return IPRequestSerializer

    def perform_create(self, serializer):
        """
        Set requested_by to current user and subnet when creating via nested route.

        Args:
            serializer: Serializer instance with validated data
        """
        subnet_pk = self.kwargs.get("subnet_pk")
        if subnet_pk:
            serializer.save(requested_by=self.request.user, subnet_id=subnet_pk)
        else:
            serializer.save(requested_by=self.request.user)

    def get_serializer_context(self):
        """Add subnet_pk to serializer context for nested routes."""
        context = super().get_serializer_context()
        subnet_pk = self.kwargs.get("subnet_pk")
        if subnet_pk:
            context["subnet_pk"] = int(subnet_pk) if isinstance(subnet_pk, str) else subnet_pk
        return context

    def create(self, request, *args, **kwargs):
        """
        Create an IP request and return full serializer data.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        # Return full serializer data after creation
        ip_request = serializer.instance
        full_serializer = IPRequestSerializer(ip_request)
        return Response(full_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        """
        Approve an IP request.

        When approved:
        1. Creates or updates the IP address with reserved status
        2. Updates request status to approved/completed
        3. Links the IP address to the request

        Args:
            request: HTTP request
            pk: IP request primary key

        Returns:
            Response with updated IP request data
        """
        ip_request = self.get_object()

        if not ip_request.can_be_approved():
            return Response(
                {
                    "error": "Request cannot be approved",
                    "detail": f"Request status is {ip_request.get_status_display()},"
                    "only pending requests can be approved.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        approval_notes = request.data.get("approval_notes", "")

        # Determine the IP address to reserve
        ip_to_reserve = ip_request.requested_ip

        # If no specific IP requested, find next available
        if not ip_to_reserve:
            from ..services.subnet_utils import get_next_available_ip

            used_ips = list(
                IPAddress.objects.filter(subnet=ip_request.subnet)
                .exclude(status="available")
                .values_list("address", flat=True)
            )
            ip_to_reserve = get_next_available_ip(ip_request.subnet.network, used_ips)

            if not ip_to_reserve:
                return Response(
                    {
                        "error": "No available IP addresses",
                        "detail": "No available IP addresses in this subnet.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Create or update IP address
        ip_address, created = IPAddress.objects.get_or_create(
            address=ip_to_reserve,
            defaults={
                "subnet": ip_request.subnet,
                "status": "reserved",
                "description": f"Reserved via IP request: {ip_request.purpose}",
            },
        )

        if not created:
            # IP already exists, update it
            if ip_address.status not in ("available", "deprecated"):
                return Response(
                    {
                        "error": "IP address already in use",
                        "detail": (
                            f"IP address {ip_to_reserve} is already in use with "
                            f"status: {ip_address.get_status_display()}"
                        ),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            ip_address.status = "reserved"
            ip_address.subnet = ip_request.subnet
            ip_address.description = f"Reserved via IP request: {ip_request.purpose}"
            ip_address.save()

        # Update request
        from django.utils import timezone

        ip_request.status = "completed"
        ip_request.approved_by = request.user
        ip_request.approved_at = timezone.now()
        ip_request.approval_notes = approval_notes
        ip_request.ip_address = ip_address
        ip_request.save()

        serializer = self.get_serializer(ip_request)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        """
        Reject an IP request.

        Args:
            request: HTTP request
            pk: IP request primary key

        Returns:
            Response with updated IP request data
        """
        ip_request = self.get_object()

        if not ip_request.can_be_rejected():
            return Response(
                {
                    "error": "Request cannot be rejected",
                    "detail": f"Request status is {ip_request.get_status_display()},"
                    "only pending requests can be rejected.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        approval_notes = request.data.get("approval_notes", "")

        # Update request
        from django.utils import timezone

        ip_request.status = "rejected"
        ip_request.approved_by = request.user
        ip_request.approved_at = timezone.now()
        ip_request.approval_notes = approval_notes
        ip_request.save()

        serializer = self.get_serializer(ip_request)
        return Response(serializer.data, status=status.HTTP_200_OK)
