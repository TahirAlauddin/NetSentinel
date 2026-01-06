from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    Customer,
    DNSRecord,
    DNSZone,
    IPAddress,
    Subnet,
    SubnetGroup,
    VLAN,
    VRF,
)
from .serializers import (
    CustomerSerializer,
    DNSRecordSerializer,
    DNSZoneSerializer,
    IPAddressSerializer,
    SubnetSerializer,
    SubnetGroupSerializer,
    VLANSerializer,
    VRFSerializer,
)


class CustomerViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing customers.
    """

    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer


class SubnetGroupViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing subnet groups.
    """

    queryset = SubnetGroup.objects.all()
    serializer_class = SubnetGroupSerializer


class VLANViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing VLANs.
    """

    queryset = VLAN.objects.select_related("location").all()
    serializer_class = VLANSerializer


class VRFViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing VRFs.
    """

    queryset = VRF.objects.select_related("location").all()
    serializer_class = VRFSerializer


class SubnetViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing subnets.
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
        """Get all child subnets for a subnet."""
        subnet = self.get_object()
        child_subnets = subnet.child_subnets.all()
        serializer = SubnetSerializer(child_subnets, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def ip_addresses(self, request, pk=None):
        """Get all IP addresses for a subnet."""
        subnet = self.get_object()
        ip_addresses = subnet.ip_addresses.all()
        serializer = IPAddressSerializer(ip_addresses, many=True)
        return Response(serializer.data)


class IPAddressViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing IP addresses.
    Supports both standalone access and nested access under subnets.
    """

    queryset = IPAddress.objects.select_related("subnet").all()
    serializer_class = IPAddressSerializer

    def get_queryset(self):
        """Filter queryset when accessed through nested router."""
        queryset = super().get_queryset()
        # Filter by subnet when accessed via nested route: /subnets/{id}/ip-addresses/
        subnet_pk = self.kwargs.get("subnet_pk")
        if subnet_pk:
            queryset = queryset.filter(subnet_id=subnet_pk)
        return queryset

    def perform_create(self, serializer):
        """Set subnet when creating via nested route."""
        subnet_pk = self.kwargs.get("subnet_pk")
        if subnet_pk:
            serializer.save(subnet_id=subnet_pk)
        else:
            serializer.save()


class DNSZoneViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing DNS zones.
    """

    queryset = DNSZone.objects.select_related("location").prefetch_related("records").all()
    serializer_class = DNSZoneSerializer

    @action(detail=True, methods=["get"])
    def records(self, request, pk=None):
        """Get all DNS records for a zone."""
        zone = self.get_object()
        records = zone.records.all()
        serializer = DNSRecordSerializer(records, many=True)
        return Response(serializer.data)


class DNSRecordViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing DNS records.
    Supports both standalone access and nested access under DNS zones.
    """

    queryset = DNSRecord.objects.select_related("zone").all()
    serializer_class = DNSRecordSerializer

    def get_queryset(self):
        """Filter queryset when accessed through nested router."""
        queryset = super().get_queryset()
        # Filter by zone when accessed via nested route: /dns-zones/{id}/records/
        zone_pk = self.kwargs.get("zone_pk")
        if zone_pk:
            queryset = queryset.filter(zone_id=zone_pk)
        return queryset

    def perform_create(self, serializer):
        """Set zone when creating via nested route."""
        zone_pk = self.kwargs.get("zone_pk")
        if zone_pk:
            serializer.save(zone_id=zone_pk)
        else:
            serializer.save()
