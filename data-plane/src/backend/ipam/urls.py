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
    IPPoolViewSet,
    IPRequestViewSet,
    PhoneNumberRangeViewSet,
    SubnetGroupViewSet,
    SubnetViewSet,
    VLANViewSet,
    VRFViewSet,
)
from .views.device_views import DeviceViewSet, DeviceTypeViewSet, RackViewSet
from .views.dhcp_views import (
    DHCPScopeViewSet,
    DHCPLeaseViewSet,
    DHCPReservationViewSet,
    DHCPOptionViewSet,
)
from .views.ip_tag_views import IPTagViewSet, IPAddressTagViewSet
from .views.ip_audit_log_views import IPAuditLogViewSet, IPAuditLogFilterViewSet
from .views.ip_note_views import IPNoteViewSet, IPNoteAttachmentViewSet, IPNoteCommentViewSet
from .views.subnet_threshold_views import SubnetThresholdViewSet, SubnetThresholdAlertViewSet
from .views.network_scan_views import NetworkScanViewSet, ScanResultViewSet
from .views.subnet_mask_views import subnet_masks_list, subnet_mask_detail

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

# DHCP routers
router.register(r"dhcp-scopes", DHCPScopeViewSet, basename="dhcp-scope")
router.register(r"dhcp-leases", DHCPLeaseViewSet, basename="dhcp-lease")
router.register(r"dhcp-reservations", DHCPReservationViewSet, basename="dhcp-reservation")
router.register(r"dhcp-options", DHCPOptionViewSet, basename="dhcp-option")

# IP Pool routers
router.register(r"ip-pools", IPPoolViewSet, basename="ip-pool")

# Device routers
router.register(r"device-types", DeviceTypeViewSet, basename="device-type")
router.register(r"racks", RackViewSet, basename="rack")
router.register(r"devices", DeviceViewSet, basename="device")

# IP Tag routers
router.register(r"ip-tags", IPTagViewSet, basename="ip-tag")
router.register(r"ip-address-tags", IPAddressTagViewSet, basename="ip-address-tag")

# IP Audit Log routers
router.register(r"ip-audit-logs", IPAuditLogViewSet, basename="ip-audit-log")
router.register(r"ip-audit-log-filters", IPAuditLogFilterViewSet, basename="ip-audit-log-filter")

# IP Note routers
router.register(r"ip-notes", IPNoteViewSet, basename="ip-note")
router.register(r"ip-note-attachments", IPNoteAttachmentViewSet, basename="ip-note-attachment")
router.register(r"ip-note-comments", IPNoteCommentViewSet, basename="ip-note-comment")

# Subnet Threshold routers
router.register(r"subnet-thresholds", SubnetThresholdViewSet, basename="subnet-threshold")
router.register(r"subnet-threshold-alerts", SubnetThresholdAlertViewSet, basename="subnet-threshold-alert")

# Nested router for network scans under subnets
subnets_router_scans = routers.NestedDefaultRouter(router, r"subnets", lookup="subnet")
subnets_router_scans.register(r"network-scans", NetworkScanViewSet, basename="subnet-network-scan")

# Nested router for scan results under scans
scans_router = routers.NestedDefaultRouter(router, r"network-scans", lookup="scan")
scans_router.register(r"results", ScanResultViewSet, basename="scan-result")

# Nested router for DHCP scopes under subnets
subnets_router_dhcp = routers.NestedDefaultRouter(router, r"subnets", lookup="subnet")
subnets_router_dhcp.register(r"dhcp-scopes", DHCPScopeViewSet, basename="subnet-dhcp-scope")

# Nested router for DHCP leases under scopes
dhcp_scopes_router = routers.NestedDefaultRouter(router, r"dhcp-scopes", lookup="scope")
dhcp_scopes_router.register(r"leases", DHCPLeaseViewSet, basename="dhcp-scope-lease")
dhcp_scopes_router.register(
    r"reservations", DHCPReservationViewSet, basename="dhcp-scope-reservation"
)
dhcp_scopes_router.register(r"options", DHCPOptionViewSet, basename="dhcp-scope-option")

# Nested router for IP pools under subnets
subnets_router_pools = routers.NestedDefaultRouter(router, r"subnets", lookup="subnet")
subnets_router_pools.register(r"ip-pools", IPPoolViewSet, basename="subnet-ip-pool")

urlpatterns = [
    path("", include(router.urls)),
    path("", include(subnets_router.urls)),
    path("", include(subnets_router_ip_requests.urls)),
    path("", include(dns_zones_router.urls)),
    path("", include(subnets_router_scans.urls)),
    path("", include(scans_router.urls)),
    path("", include(subnets_router_dhcp.urls)),
    path("", include(dhcp_scopes_router.urls)),
    path("", include(subnets_router_pools.urls)),
    # Subnet mask reference endpoints
    path("subnet-masks/", subnet_masks_list, name="subnet-masks-list"),
    path("subnet-masks/<int:prefix_length>/", subnet_mask_detail, name="subnet-mask-detail"),
]
