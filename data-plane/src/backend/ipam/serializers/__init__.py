from .customer import CustomerSerializer
from .dns import DNSRecordSerializer, DNSZoneSerializer
from .ip_address import IPAddressSerializer
from .ip_assignment_history import IPAssignmentHistorySerializer
from .ip_request import IPRequestSerializer, IPRequestCreateSerializer
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
]
