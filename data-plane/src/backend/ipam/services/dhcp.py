"""
DHCP Service for IPAM.

Provides DHCP scope management, lease tracking, and reservation management.
"""

import ipaddress
from datetime import timedelta
from typing import Dict, Optional

from django.utils import timezone

from ..models import DHCPLease, DHCPScope, IPAddress


def calculate_scope_availability(scope_id: int) -> Dict:
    """
    Calculate availability statistics for a DHCP scope.

    Args:
        scope_id: DHCPScope ID

    Returns:
        Dictionary with availability statistics
    """
    scope = DHCPScope.objects.get(id=scope_id)

    try:
        start = ipaddress.ip_address(scope.start_ip)
        end = ipaddress.ip_address(scope.end_ip)
        total_ips = int(end) - int(start) + 1
    except (ValueError, AttributeError):
        total_ips = 0

    active_leases = scope.leases.filter(status="active").count()
    reservations = scope.reservations.filter(is_active=True).count()
    max_leases = scope.max_leases or total_ips

    available = max(0, max_leases - active_leases - reservations)
    utilization = (active_leases / max_leases * 100) if max_leases > 0 else 0

    return {
        "total_ips": total_ips,
        "max_leases": max_leases,
        "active_leases": active_leases,
        "reservations": reservations,
        "available": available,
        "utilization_percentage": round(utilization, 2),
    }


def create_lease(
    scope_id: int,
    ip_address: str,
    mac_address: str,
    hostname: Optional[str] = None,
    lease_duration: Optional[int] = None,
) -> DHCPLease:
    """
    Create a new DHCP lease.

    Args:
        scope_id: DHCPScope ID
        ip_address: IP address to lease
        mac_address: MAC address of the client
        hostname: Optional hostname
        lease_duration: Lease duration in seconds (uses scope default if not provided)

    Returns:
        DHCPLease instance
    """
    scope = DHCPScope.objects.get(id=scope_id)

    if not lease_duration:
        lease_duration = scope.lease_duration

    now = timezone.now()
    lease_end = now + timedelta(seconds=lease_duration)

    # Check if there's an existing lease for this IP/MAC
    existing_lease = DHCPLease.objects.filter(
        scope=scope,
        ip_address=ip_address,
        mac_address=mac_address,
        status="active",
    ).first()

    if existing_lease:
        # Renew existing lease
        existing_lease.lease_start = now
        existing_lease.lease_end = lease_end
        existing_lease.lease_renewal = now
        existing_lease.hostname = hostname or existing_lease.hostname
        existing_lease.save()
        return existing_lease

    # Create new lease
    lease = DHCPLease.objects.create(
        scope=scope,
        ip_address=ip_address,
        mac_address=mac_address,
        hostname=hostname,
        lease_start=now,
        lease_end=lease_end,
        lease_renewal=now,
        status="active",
    )

    return lease


def release_lease(lease_id: int) -> None:
    """
    Release a DHCP lease.

    Args:
        lease_id: DHCPLease ID
    """
    lease = DHCPLease.objects.get(id=lease_id)
    lease.status = "released"
    lease.save()


def expire_leases() -> int:
    """
    Expire all leases that have passed their lease_end time.

    Returns:
        Number of leases expired
    """
    now = timezone.now()
    expired = DHCPLease.objects.filter(
        status="active",
        lease_end__lt=now,
    ).update(status="expired")

    return expired


def assign_ip_from_dhcp_pool(
    scope_id: int,
    mac_address: str,
    hostname: Optional[str] = None,
) -> Optional[str]:
    """
    Automatically assign an IP address from a DHCP scope.

    Args:
        scope_id: DHCPScope ID
        mac_address: MAC address of the client
        hostname: Optional hostname

    Returns:
        Assigned IP address or None if no IPs available
    """
    scope = DHCPScope.objects.get(id=scope_id)

    # Check for existing reservation
    reservation = scope.reservations.filter(
        mac_address=mac_address,
        is_active=True,
    ).first()

    if reservation:
        # Use reserved IP
        ip_address = reservation.ip_address
        create_lease(scope_id, ip_address, mac_address, hostname)
        return ip_address

    # Find available IP in scope
    try:
        start = ipaddress.ip_address(scope.start_ip)
        end = ipaddress.ip_address(scope.end_ip)

        # Get all leased IPs
        leased_ips = set(scope.leases.filter(status="active").values_list("ip_address", flat=True))

        # Get all reserved IPs
        reserved_ips = set(
            scope.reservations.filter(is_active=True).values_list("ip_address", flat=True)
        )

        # Find first available IP
        current = int(start)
        end_int = int(end)

        while current <= end_int:
            ip_str = str(ipaddress.ip_address(current))

            if ip_str not in leased_ips and ip_str not in reserved_ips:
                # Check if IP exists in IPAM and is available
                ip_addr = IPAddress.objects.filter(address=ip_str).first()
                if not ip_addr or ip_addr.status == "available":
                    # Assign the IP
                    create_lease(scope_id, ip_str, mac_address, hostname)
                    return ip_str

            current += 1

        return None
    except (ValueError, AttributeError):
        return None


def export_dhcp_config(scope_id: int, format: str = "isc-dhcpd") -> str:
    """
    Export DHCP scope configuration for a DHCP server.

    Args:
        scope_id: DHCPScope ID
        format: Configuration format (isc-dhcpd, windows-dhcp, etc.)

    Returns:
        Configuration string
    """
    scope = DHCPScope.objects.get(id=scope_id)
    reservations = scope.reservations.filter(is_active=True)

    if format == "isc-dhcpd":
        # ISC DHCPd format
        config = f"""
# DHCP Scope: {scope.name}
subnet {scope.subnet.network if scope.subnet else '0.0.0.0'} netmask {scope.subnet_mask} {{
    range {scope.start_ip} {scope.end_ip};
    default-lease-time {scope.lease_duration};
    max-lease-time {scope.lease_duration};
"""
        if scope.gateway:
            config += f"    option routers {scope.gateway};\n"
        if scope.dns_servers:
            dns_list = scope.dns_servers.replace(",", " ").strip()
            config += f"    option domain-name-servers {dns_list};\n"

        config += "}\n\n"

        # Add reservations
        for reservation in reservations:
            config += f"""
host {reservation.hostname or f"client-{reservation.mac_address.replace(':', '-')}"} {{
    hardware ethernet {reservation.mac_address};
    fixed-address {reservation.ip_address};
}}
"""

        return config

    elif format == "windows-dhcp":
        # Windows DHCP format (PowerShell)
        ip_parts = scope.start_ip.split(".")
        scope_id = f"{ip_parts[0]}.{ip_parts[1]}.{ip_parts[2]}.0"
        lease_hours = scope.lease_duration // 3600

        config = f"""
# DHCP Scope: {scope.name}
Add-DhcpServerv4Scope -Name "{scope.name}" -StartRange {scope.start_ip} \\
    -EndRange {scope.end_ip} -SubnetMask {scope.subnet_mask}
Set-DhcpServerv4Scope -ScopeId {scope_id} \\
    -LeaseDuration (New-TimeSpan -Hours {lease_hours})
"""
        if scope.gateway:
            config += (
                f"Set-DhcpServerv4OptionValue -ScopeId {scope_id} "
                f"-OptionId 3 -Value {scope.gateway}\n"
            )
        if scope.dns_servers:
            dns_list = scope.dns_servers.split(",")
            dns_value = ",".join(dns_list)
            config += (
                f"Set-DhcpServerv4OptionValue -ScopeId {scope_id} "
                f"-OptionId 6 -Value {dns_value}\n"
            )

        # Add reservations
        for reservation in reservations:
            config += (
                f"Add-DhcpServerv4Reservation -ScopeId {scope_id} "
                f"-IPAddress {reservation.ip_address} "
                f"-ClientId {reservation.mac_address}\n"
            )

        return config

    return ""


def get_lease_statistics(scope_id: Optional[int] = None) -> Dict:
    """
    Get lease statistics for a scope or all scopes.

    Args:
        scope_id: Optional scope ID to filter by

    Returns:
        Dictionary with lease statistics
    """
    if scope_id:
        scopes = DHCPScope.objects.filter(id=scope_id)
    else:
        scopes = DHCPScope.objects.all()

    total_leases = 0
    active_leases = 0
    expired_leases = 0
    released_leases = 0

    for scope in scopes:
        leases = scope.leases.all()
        total_leases += leases.count()
        active_leases += leases.filter(status="active").count()
        expired_leases += leases.filter(status="expired").count()
        released_leases += leases.filter(status="released").count()

    return {
        "total_leases": total_leases,
        "active_leases": active_leases,
        "expired_leases": expired_leases,
        "released_leases": released_leases,
        "scopes_count": scopes.count(),
    }
