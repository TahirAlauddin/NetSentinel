from .customer import CustomerSerializer
from .device import (
    DeviceCreateUpdateSerializer,
    DeviceSerializer,
    DeviceTypeSerializer,
    RackCreateUpdateSerializer,
    RackSerializer,
)
from .dhcp import (
    DHCPLeaseCreateSerializer,
    DHCPLeaseSerializer,
    DHCPOptionCreateUpdateSerializer,
    DHCPOptionSerializer,
    DHCPReservationSerializer,
    DHCPScopeCreateUpdateSerializer,
    DHCPScopeSerializer,
)
from .dns import DNSRecordSerializer, DNSZoneSerializer
from .ip_address import IPAddressSerializer
from .ip_assignment_history import IPAssignmentHistorySerializer
from .ip_audit_log import IPAuditLogFilterSerializer, IPAuditLogSerializer
from .ip_note import (
    IPNoteAttachmentSerializer,
    IPNoteCommentSerializer,
    IPNoteCreateUpdateSerializer,
    IPNoteSerializer,
)
from .ip_pool import IPPoolCreateUpdateSerializer, IPPoolSerializer
from .ip_request import IPRequestCreateSerializer, IPRequestSerializer
from .ip_tag import (
    IPAddressTagCreateSerializer,
    IPAddressTagSerializer,
    IPAddressWithTagsSerializer,
    IPTagCreateUpdateSerializer,
    IPTagSerializer,
)
from .network_scan import (
    NetworkScanCreateSerializer,
    NetworkScanSerializer,
    ScanResultDetailSerializer,
    ScanResultSerializer,
)
from .phone_number import PhoneNumberRangeCreateUpdateSerializer, PhoneNumberRangeSerializer
from .subnet import SubnetSerializer
from .subnet_group import SubnetGroupSerializer
from .subnet_threshold import (
    SubnetThresholdAlertSerializer,
    SubnetThresholdCreateUpdateSerializer,
    SubnetThresholdSerializer,
)
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
    "IPTagSerializer",
    "IPTagCreateUpdateSerializer",
    "IPAddressTagSerializer",
    "IPAddressTagCreateSerializer",
    "IPAddressWithTagsSerializer",
    "IPAuditLogSerializer",
    "IPAuditLogFilterSerializer",
    "IPNoteSerializer",
    "IPNoteCreateUpdateSerializer",
    "IPNoteAttachmentSerializer",
    "IPNoteCommentSerializer",
    "SubnetThresholdSerializer",
    "SubnetThresholdCreateUpdateSerializer",
    "SubnetThresholdAlertSerializer",
]
