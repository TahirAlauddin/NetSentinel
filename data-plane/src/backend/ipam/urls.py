from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers

from .views import (
    CustomerViewSet,
    DNSRecordViewSet,
    DNSZoneViewSet,
    IPAddressViewSet,
    SubnetGroupViewSet,
    SubnetViewSet,
    VLANViewSet,
    VRFViewSet,
)

# Main router for top-level resources
router = DefaultRouter()
router.register(r"customers", CustomerViewSet, basename="customer")
router.register(r"subnet-groups", SubnetGroupViewSet, basename="subnet-group")
router.register(r"vlans", VLANViewSet, basename="vlan")
router.register(r"vrfs", VRFViewSet, basename="vrf")
router.register(r"subnets", SubnetViewSet, basename="subnet")
router.register(r"dns-zones", DNSZoneViewSet, basename="dns-zone")

# Nested router for IP addresses under subnets
subnets_router = routers.NestedDefaultRouter(router, r"subnets", lookup="subnet")
subnets_router.register(r"ip-addresses", IPAddressViewSet, basename="subnet-ip-address")

# Nested router for DNS records under DNS zones
dns_zones_router = routers.NestedDefaultRouter(router, r"dns-zones", lookup="zone")
dns_zones_router.register(r"records", DNSRecordViewSet, basename="dns-zone-record")

# Standalone router for IP addresses (can also be accessed directly)
router.register(r"ip-addresses", IPAddressViewSet, basename="ip-address")

# Standalone router for DNS records (can also be accessed directly)
router.register(r"dns-records", DNSRecordViewSet, basename="dns-record")

urlpatterns = [
    path("", include(router.urls)),
    path("", include(subnets_router.urls)),
    path("", include(dns_zones_router.urls)),
]
