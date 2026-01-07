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

from ..models import VLAN, VRF, Customer, DNSRecord, DNSZone, IPAddress, Subnet, SubnetGroup
from ..serializers import (
    CustomerSerializer,
    DNSRecordSerializer,
    DNSZoneSerializer,
    IPAddressSerializer,
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
    """

    queryset = IPAddress.objects.select_related("subnet").all()
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
                        "error": "A DNS record with this combination of zone, name, and record_type already exists.",
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
