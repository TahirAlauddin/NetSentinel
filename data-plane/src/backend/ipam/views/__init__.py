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
    DNSRecord,
    DNSZone,
    FavoriteSubnet,
    IPAddress,
    IPRequest,
    Subnet,
    SubnetGroup,
)
from ..serializers import (
    CustomerSerializer,
    DNSRecordSerializer,
    DNSZoneSerializer,
    IPAddressSerializer,
    IPRequestCreateSerializer,
    IPRequestSerializer,
    SubnetGroupSerializer,
    SubnetSerializer,
    VLANSerializer,
    VRFSerializer,
)


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

    @action(detail=True, methods=["post"])
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
        from ..services.ip_assignment import auto_assign_ip_from_subnet
        from ..serializers import IPAddressSerializer

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
        Set subnet when creating via nested route.

        Automatically assigns the IP address to the parent subnet
        when created through the nested endpoint.

        Args:
            serializer: Serializer instance with validated data
        """
        subnet_pk = self.kwargs.get("subnet_pk")
        if subnet_pk:
            serializer.save(subnet_id=subnet_pk)
        else:
            serializer.save()

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
            history = assign_ip_to_asset(
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
            history = release_ip_from_asset(
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
        history = IPAssignmentHistory.objects.filter(ip_address=ip_address).order_by("-created_at")
        
        serializer = IPAssignmentHistorySerializer(history, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


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
            serializer.save(
                requested_by=self.request.user,
                subnet_id=subnet_pk
            )
        else:
            serializer.save(requested_by=self.request.user)

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
                    "detail": f"Request status is {ip_request.get_status_display()}, only pending requests can be approved.",
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
                        "detail": f"IP address {ip_to_reserve} is already in use with status: {ip_address.get_status_display()}",
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
                    "detail": f"Request status is {ip_request.get_status_display()}, only pending requests can be rejected.",
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
