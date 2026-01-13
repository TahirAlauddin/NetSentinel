"""
IP Address Search & Discovery Service

Provides advanced search and discovery capabilities for IP addresses.
Includes filtering, range search, conflict detection, and DNS integration.
"""

import ipaddress
from typing import Dict, List, Optional, Set

from django.db.models import Q
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank

from ..models import IPAddress, Subnet, DNSRecord


def search_ip_addresses(
    query: Optional[str] = None,
    filters: Optional[Dict] = None,
    subnet_id: Optional[int] = None,
    status: Optional[str] = None,
    assigned_to_asset: Optional[int] = None,
    customer_id: Optional[int] = None,
    location_id: Optional[int] = None,
    is_ipv6: Optional[bool] = None,
) -> List[IPAddress]:
    """
    Advanced search for IP addresses with multiple filters.

    Args:
        query: Search query (can be IP address, description, or asset name)
        filters: Additional filters dictionary
        subnet_id: Filter by subnet ID
        status: Filter by status
        assigned_to_asset: Filter by assigned asset ID
        customer_id: Filter by customer (via subnet)
        location_id: Filter by location (via subnet)
        is_ipv6: Filter by IPv4/IPv6

    Returns:
        List of IPAddress instances matching the search criteria
    """
    queryset = IPAddress.objects.select_related(
        "subnet", "subnet__customer", "subnet__location", "assigned_to_asset"
    ).all()

    # Text search
    if query:
        # Try to parse as IP address
        try:
            ip_obj = ipaddress.ip_address(query)
            queryset = queryset.filter(address=str(ip_obj))
        except ValueError:
            # Not an IP, search in description and asset name
            queryset = queryset.filter(
                Q(description__icontains=query)
                | Q(assigned_to_asset__name__icontains=query)
                | Q(address__icontains=query)
            )

    # Status filter
    if status:
        queryset = queryset.filter(status=status)

    # Subnet filter
    if subnet_id:
        queryset = queryset.filter(subnet_id=subnet_id)

    # Asset filter
    if assigned_to_asset:
        queryset = queryset.filter(assigned_to_asset_id=assigned_to_asset)

    # Customer filter (via subnet)
    if customer_id:
        queryset = queryset.filter(subnet__customer_id=customer_id)

    # Location filter (via subnet)
    if location_id:
        queryset = queryset.filter(subnet__location_id=location_id)

    # IPv4/IPv6 filter
    if is_ipv6 is not None:
        queryset = queryset.filter(subnet__is_ipv6=is_ipv6)

    # Additional filters
    if filters:
        if "vlan_id" in filters:
            queryset = queryset.filter(subnet__vlan_id=filters["vlan_id"])
        if "vrf_id" in filters:
            queryset = queryset.filter(subnet__vrf_id=filters["vrf_id"])

    return list(queryset)


def search_ip_range(start_ip: str, end_ip: str, subnet_id: Optional[int] = None) -> List[IPAddress]:
    """
    Search for IP addresses within a range.

    Args:
        start_ip: Starting IP address
        end_ip: Ending IP address
        subnet_id: Optional subnet filter

    Returns:
        List of IPAddress instances in the range
    """
    try:
        start = ipaddress.ip_address(start_ip)
        end = ipaddress.ip_address(end_ip)

        # Ensure start <= end
        if start > end:
            start, end = end, start

        queryset = IPAddress.objects.all()

        if subnet_id:
            queryset = queryset.filter(subnet_id=subnet_id)

        # Filter IPs in range
        results = []
        for ip_addr in queryset:
            try:
                ip_obj = ipaddress.ip_address(ip_addr.address)
                if start <= ip_obj <= end:
                    results.append(ip_addr)
            except ValueError:
                continue

        return results
    except ValueError:
        return []


def search_by_hostname(hostname: str) -> List[IPAddress]:
    """
    Search for IP addresses by hostname/DNS name.

    Args:
        hostname: Hostname or FQDN to search for

    Returns:
        List of IPAddress instances with matching DNS records
    """
    # Search DNS records for the hostname
    dns_records = DNSRecord.objects.filter(
        Q(name__icontains=hostname) | Q(value__icontains=hostname)
    ).filter(record_type__in=["A", "AAAA"])

    # Extract IP addresses from DNS records
    ip_addresses = []
    for record in dns_records:
        try:
            # Try to find IP address matching the DNS record value
            ip_addr = IPAddress.objects.filter(address=record.value).first()
            if ip_addr:
                ip_addresses.append(ip_addr)
        except (ValueError, AttributeError):
            continue

    return ip_addresses


def detect_ip_conflicts(ip_address: str, exclude_subnet_id: Optional[int] = None) -> List[Dict]:
    """
    Detect IP address conflicts across subnets.

    Args:
        ip_address: IP address to check
        exclude_subnet_id: Optional subnet ID to exclude from conflict check

    Returns:
        List of conflict dictionaries with details
    """
    try:
        ip_obj = ipaddress.ip_address(ip_address)
    except ValueError:
        return []

    # Find all IP addresses with this IP
    conflicts = IPAddress.objects.filter(address=str(ip_obj))

    if exclude_subnet_id:
        conflicts = conflicts.exclude(subnet_id=exclude_subnet_id)

    conflict_list = []
    for ip_addr in conflicts:
        conflict_list.append(
            {
                "ip_address": ip_addr.address,
                "subnet_id": ip_addr.subnet.id if ip_addr.subnet else None,
                "subnet_network": ip_addr.subnet.network if ip_addr.subnet else None,
                "status": ip_addr.status,
                "assigned_to_asset": (
                    ip_addr.assigned_to_asset.id if ip_addr.assigned_to_asset else None
                ),
                "description": ip_addr.description,
            }
        )

    return conflict_list


def get_ip_details(ip_address: str) -> Dict:
    """
    Get comprehensive details for an IP address including DNS, assignments, etc.

    Args:
        ip_address: IP address to get details for

    Returns:
        Dictionary with comprehensive IP details
    """
    try:
        ip_obj = ipaddress.ip_address(ip_address)
    except ValueError:
        return {
            "ip_address": ip_address,
            "exists": False,
            "error": f"Invalid IP address: {ip_address}",
            "message": "IP address not found - invalid IP address format",
        }

    # Get IP address record
    ip_addr = (
        IPAddress.objects.filter(address=str(ip_obj))
        .select_related("subnet", "assigned_to_asset", "assigned_by")
        .first()
    )

    if not ip_addr:
        return {
            "ip_address": ip_address,
            "exists": False,
            "message": "IP address not found in IPAM",
        }

    # Get DNS records
    dns_records = DNSRecord.objects.filter(value=ip_address).select_related("zone")

    # Get conflicts
    conflicts = detect_ip_conflicts(
        ip_address, exclude_subnet_id=ip_addr.subnet.id if ip_addr.subnet else None
    )

    # Get assignment history (if available)
    assignment_history = []
    if hasattr(ip_addr, "assignment_history"):
        assignment_history = list(ip_addr.assignment_history.all()[:10])  # Last 10 entries

    return {
        "ip_address": ip_address,
        "exists": True,
        "ip_address_id": ip_addr.id,
        "subnet": {
            "id": ip_addr.subnet.id if ip_addr.subnet else None,
            "network": ip_addr.subnet.network if ip_addr.subnet else None,
        },
        "status": ip_addr.status,
        "description": ip_addr.description,
        "assigned_to_asset": (
            {
                "id": ip_addr.assigned_to_asset.id if ip_addr.assigned_to_asset else None,
                "name": ip_addr.assigned_to_asset.name if ip_addr.assigned_to_asset else None,
            }
            if ip_addr.assigned_to_asset
            else None
        ),
        "dns_records": [
            {
                "name": record.name,
                "zone": record.zone.name,
                "record_type": record.record_type,
                "ttl": record.ttl,
            }
            for record in dns_records
        ],
        "conflicts": conflicts,
        "created_at": ip_addr.created_at.isoformat() if ip_addr.created_at else None,
        "updated_at": ip_addr.updated_at.isoformat() if ip_addr.updated_at else None,
    }


def find_available_ips_in_subnet(
    subnet_id: int, count: int = 10, exclude_ips: Optional[List[str]] = None
) -> List[str]:
    """
    Find available IP addresses in a subnet.

    Args:
        subnet_id: Subnet ID
        count: Number of available IPs to find
        exclude_ips: List of IPs to exclude

    Returns:
        List of available IP addresses
    """
    try:
        subnet = Subnet.objects.get(id=subnet_id)
    except Subnet.DoesNotExist:
        return []

    from ..services.subnet_utils import get_next_available_ip

    # Get used IPs
    used_ips = list(
        IPAddress.objects.filter(subnet=subnet)
        .exclude(status="available")
        .values_list("address", flat=True)
    )

    # Add excluded IPs
    if exclude_ips:
        used_ips.extend(exclude_ips)

    # Find available IPs
    available = []
    for _ in range(count):
        next_ip = get_next_available_ip(subnet.network, used_ips)
        if next_ip:
            available.append(next_ip)
            used_ips.append(next_ip)
        else:
            break

    return available
