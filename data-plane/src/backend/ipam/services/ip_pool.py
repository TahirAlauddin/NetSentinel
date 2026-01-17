"""
IP Pool Service for IPAM.

Provides IP pool management and pool-based IP assignment.
"""

from typing import Dict, List, Optional

from ..models import IPAddress, IPPool


def assign_ip_from_pool(
    pool_id: int,
    description: Optional[str] = None,
) -> Optional[IPAddress]:
    """
    Assign an IP address from a pool.

    Args:
        pool_id: IPPool ID
        description: Optional description for the IP

    Returns:
        IPAddress instance or None if no IPs available
    """
    pool = IPPool.objects.get(id=pool_id)

    # Get all assigned IPs in this pool
    assigned_ips = set(
        IPAddress.objects.filter(
            address__gte=pool.start_ip,
            address__lte=pool.end_ip,
            status__in=["assigned", "reserved"],
        ).values_list("address", flat=True)
    )

    # Find first available IP
    import ipaddress

    try:
        start = ipaddress.ip_address(pool.start_ip)
        end = ipaddress.ip_address(pool.end_ip)

        current = int(start)
        end_int = int(end)

        # Calculate reserved IPs
        reserved_count = pool.get_reserved_count()
        reserved_ips = set()
        if reserved_count > 0:
            # Reserve the last N IPs
            reserved_start = end_int - reserved_count + 1
            for i in range(reserved_start, end_int + 1):
                reserved_ips.add(str(ipaddress.ip_address(i)))

        while current <= end_int:
            ip_str = str(ipaddress.ip_address(current))

            if ip_str not in assigned_ips and ip_str not in reserved_ips:
                # Create IP address
                ip_addr = IPAddress.objects.create(
                    address=ip_str,
                    subnet=pool.subnet,
                    status="assigned",
                    description=description or f"Assigned from pool: {pool.name}",
                )
                return ip_addr

            current += 1

        return None
    except (ValueError, AttributeError):
        return None


def get_pool_utilization(pool_id: int) -> Dict:
    """
    Get utilization statistics for an IP pool.

    Args:
        pool_id: IPPool ID

    Returns:
        Dictionary with utilization statistics
    """
    pool = IPPool.objects.get(id=pool_id)

    total = pool.get_total_ips()
    reserved = pool.get_reserved_count()
    available = pool.get_available_count()
    used = total - reserved - available

    utilization = (used / total * 100) if total > 0 else 0

    return {
        "pool_id": pool.id,
        "pool_name": pool.name,
        "total_ips": total,
        "used_ips": used,
        "reserved_ips": reserved,
        "available_ips": available,
        "utilization_percentage": round(utilization, 2),
    }


def get_all_pools_utilization(subnet_id: Optional[int] = None) -> List[Dict]:
    """
    Get utilization for all pools or pools in a subnet.

    Args:
        subnet_id: Optional subnet ID to filter by

    Returns:
        List of utilization dictionaries
    """
    if subnet_id:
        pools = IPPool.objects.filter(subnet_id=subnet_id, is_active=True)
    else:
        pools = IPPool.objects.filter(is_active=True)

    return [get_pool_utilization(pool.id) for pool in pools]
