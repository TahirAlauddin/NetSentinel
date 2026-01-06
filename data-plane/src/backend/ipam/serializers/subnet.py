from rest_framework import serializers

from infrastructure.serializers import AssetLocationSerializer
from ..models import Subnet
from .customer import CustomerSerializer
from .subnet_group import SubnetGroupSerializer
from .vlan import VLANSerializer
from .vrf import VRFSerializer


class SubnetSerializer(serializers.ModelSerializer):
    """Serializer for Subnet."""

    group_detail = SubnetGroupSerializer(source="group", read_only=True)
    location_detail = AssetLocationSerializer(source="location", read_only=True)
    vlan_detail = VLANSerializer(source="vlan", read_only=True)
    vrf_detail = VRFSerializer(source="vrf", read_only=True)
    master_subnet_detail = serializers.SerializerMethodField()
    customer_detail = CustomerSerializer(source="customer", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    child_subnets_count = serializers.SerializerMethodField()
    ip_addresses_count = serializers.SerializerMethodField()

    def get_master_subnet_detail(self, obj):
        """Return master subnet details if exists."""
        if obj.master_subnet:
            return {
                "id": obj.master_subnet.id,
                "network": obj.master_subnet.network,
            }
        return None

    def get_child_subnets_count(self, obj):
        """Return count of child subnets."""
        return obj.child_subnets.count()

    def get_ip_addresses_count(self, obj):
        """Return count of IP addresses in this subnet."""
        return obj.ip_addresses.count()

    class Meta:
        model = Subnet
        fields = [
            "id",
            "network",
            "description",
            "group",
            "group_detail",
            "location",
            "location_detail",
            "vlan",
            "vlan_detail",
            "vrf",
            "vrf_detail",
            "gateway_ip",
            "nameservers",
            "master_subnet",
            "master_subnet_detail",
            "customer",
            "customer_detail",
            "is_ipv6",
            "status",
            "status_display",
            "child_subnets_count",
            "ip_addresses_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
