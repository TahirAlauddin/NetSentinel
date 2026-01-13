"""
IPAM URL configuration.

This module defines URL routing for IPAM (IP Address Management) endpoints.
Includes both top-level routes and nested routes for related resources.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers

from .views import (
    CustomerViewSet,
    DNSRecordViewSet,
    DNSZoneViewSet,
    IPAddressViewSet,
    IPRequestViewSet,
    PhoneNumberRangeViewSet,
    SubnetGroupViewSet,
    SubnetViewSet,
    VLANViewSet,
    VRFViewSet,
)
from .views.network_scan_views import NetworkScanViewSet, ScanResultViewSet

# Main router for top-level resources
router = DefaultRouter()
router.register(r"customers", CustomerViewSet, basename="customer")
router.register(r"subnet-groups", SubnetGroupViewSet, basename="subnet-group")
router.register(r"vlans", VLANViewSet, basename="vlan")
router.register(r"vrfs", VRFViewSet, basename="vrf")
router.register(r"subnets", SubnetViewSet, basename="subnet")
router.register(r"dns-zones", DNSZoneViewSet, basename="dns-zone")
router.register(r"phone-numbers", PhoneNumberRangeViewSet, basename="phone-number")

# Nested router for IP addresses under subnets
subnets_router = routers.NestedDefaultRouter(router, r"subnets", lookup="subnet")
subnets_router.register(r"ip-addresses", IPAddressViewSet, basename="subnet-ip-address")

# Nested router for DNS records under DNS zones
dns_zones_router = routers.NestedDefaultRouter(router, r"dns-zones", lookup="zone")
dns_zones_router.register(r"records", DNSRecordViewSet, basename="dns-zone-record")

# Nested router for IP requests under subnets
subnets_router_ip_requests = routers.NestedDefaultRouter(router, r"subnets", lookup="subnet")
subnets_router_ip_requests.register(r"ip-requests", IPRequestViewSet, basename="subnet-ip-request")

# Standalone router for IP addresses (can also be accessed directly)
router.register(r"ip-addresses", IPAddressViewSet, basename="ip-address")

# Standalone router for DNS records (can also be accessed directly)
router.register(r"dns-records", DNSRecordViewSet, basename="dns-record")

# Standalone router for IP requests (can also be accessed directly)
router.register(r"ip-requests", IPRequestViewSet, basename="ip-request")

# Network scan routers
router.register(r"network-scans", NetworkScanViewSet, basename="network-scan")
router.register(r"scan-results", ScanResultViewSet, basename="scan-result")

# Nested router for network scans under subnets
subnets_router_scans = routers.NestedDefaultRouter(router, r"subnets", lookup="subnet")
subnets_router_scans.register(r"network-scans", NetworkScanViewSet, basename="subnet-network-scan")

# Nested router for scan results under scans
scans_router = routers.NestedDefaultRouter(router, r"network-scans", lookup="scan")
scans_router.register(r"results", ScanResultViewSet, basename="scan-result")

urlpatterns = [
    path("", include(router.urls)),
    path("", include(subnets_router.urls)),
    path("", include(subnets_router_ip_requests.urls)),
    path("", include(dns_zones_router.urls)),
    path("", include(subnets_router_scans.urls)),
    path("", include(scans_router.urls)),
]
