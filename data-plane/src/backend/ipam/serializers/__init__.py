from .customer import CustomerSerializer
from .device import (
    DeviceCreateUpdateSerializer,
    DeviceSerializer,
    DeviceTypeSerializer,
    RackCreateUpdateSerializer,
    RackSerializer,
)
from .dhcp import (
    DHCPScopeSerializer,
    DHCPScopeCreateUpdateSerializer,
    DHCPLeaseSerializer,
    DHCPLeaseCreateSerializer,
    DHCPReservationSerializer,
    DHCPOptionSerializer,
    DHCPOptionCreateUpdateSerializer,
)
from .dns import DNSRecordSerializer, DNSZoneSerializer
from .ip_address import IPAddressSerializer
from .ip_assignment_history import IPAssignmentHistorySerializer
from .ip_pool import IPPoolSerializer, IPPoolCreateUpdateSerializer
from .ip_request import IPRequestSerializer, IPRequestCreateSerializer
from .network_scan import (
    NetworkScanSerializer,
    NetworkScanCreateSerializer,
    ScanResultSerializer,
    ScanResultDetailSerializer,
)
from .phone_number import (
    PhoneNumberRangeSerializer,
    PhoneNumberRangeCreateUpdateSerializer,
)
from .subnet import SubnetSerializer
from .subnet_group import SubnetGroupSerializer
from .vlan import VLANSerializer
from .vrf import VRFSerializer

__all__ = [
    "SubnetGroupSerializer",
    "SubnetSerializer",
    "VLANSerializer",
    "VRFSerializer",
    "DNSZoneSerializer",
    "DNSRecordSerializer",
    "IPAddressSerializer",
    "CustomerSerializer",
    "IPRequestSerializer",
    "IPRequestCreateSerializer",
    "IPAssignmentHistorySerializer",
    "NetworkScanSerializer",
    "NetworkScanCreateSerializer",
    "ScanResultSerializer",
    "ScanResultDetailSerializer",
    "PhoneNumberRangeSerializer",
    "PhoneNumberRangeCreateUpdateSerializer",
    "DHCPScopeSerializer",
    "DHCPScopeCreateUpdateSerializer",
    "DHCPLeaseSerializer",
    "DHCPLeaseCreateSerializer",
    "DHCPReservationSerializer",
    "DHCPOptionSerializer",
    "DHCPOptionCreateUpdateSerializer",
    "IPPoolSerializer",
    "IPPoolCreateUpdateSerializer",
    "DeviceSerializer",
    "DeviceCreateUpdateSerializer",
    "DeviceTypeSerializer",
    "RackSerializer",
    "RackCreateUpdateSerializer",
]
