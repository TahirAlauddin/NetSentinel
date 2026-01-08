"""
Utility functions for subnet management and IP address calculations.
"""

import ipaddress
from typing import Optional, Tuple


def parse_cidr(network: str) -> Tuple[ipaddress.IPv4Network | ipaddress.IPv6Network, bool]:
    """
    Parse a CIDR notation string and return the network object and IPv6 flag.

    Args:
        network: Network in CIDR notation (e.g., "192.168.1.0/24" or "2001:db8::/32")

    Returns:
        Tuple of (network object, is_ipv6 boolean)

    Raises:
        ValueError: If the network string is invalid
    """
    try:
        net = ipaddress.ip_network(network, strict=False)
        is_ipv6 = isinstance(net, ipaddress.IPv6Network)
        return net, is_ipv6
    except ValueError as e:
        raise ValueError(f"Invalid CIDR notation: {network}") from e


def get_network_info(network: str) -> dict:
    """
    Get detailed information about a network.

    Args:
        network: Network in CIDR notation

    Returns:
        Dictionary containing network information:
        - network: Network address
        - netmask: Netmask
        - broadcast: Broadcast address (IPv4 only)
        - first_ip: First usable IP
        - last_ip: Last usable IP
        - total_hosts: Total number of hosts
        - usable_hosts: Number of usable hosts
        - is_ipv6: Whether this is an IPv6 network
    """
    net, is_ipv6 = parse_cidr(network)

    info = {
        "network": str(net.network_address),
        "netmask": str(net.netmask),
        "is_ipv6": is_ipv6,
        "prefix_length": net.prefixlen,
        "total_hosts": net.num_addresses,
    }

    if is_ipv6:
        info["first_ip"] = str(net.network_address)
        info["last_ip"] = str(
            net.broadcast_address if hasattr(net, "broadcast_address") else net[-1]
        )
        info["usable_hosts"] = net.num_addresses
    else:
        # IPv4 specific
        info["broadcast"] = str(net.broadcast_address)
        info["first_ip"] = (
            str(net.network_address + 1) if net.num_addresses > 2 else str(net.network_address)
        )
        info["last_ip"] = (
            str(net.broadcast_address - 1) if net.num_addresses > 2 else str(net.broadcast_address)
        )
        info["usable_hosts"] = max(0, net.num_addresses - 2)  # Exclude network and broadcast

    return info


def is_ip_in_subnet(ip: str, subnet: str) -> bool:
    """
    Check if an IP address belongs to a subnet.

    Args:
        ip: IP address to check
        subnet: Subnet in CIDR notation

    Returns:
        True if IP is in subnet, False otherwise
    """
    try:
        ip_obj = ipaddress.ip_address(ip)
        net = ipaddress.ip_network(subnet, strict=False)
        return ip_obj in net
    except (ValueError, TypeError):
        return False


def get_next_available_ip(subnet: str, used_ips: list[str]) -> Optional[str]:
    """
    Get the next available IP address in a subnet.

    Args:
        subnet: Subnet in CIDR notation
        used_ips: List of already used IP addresses

    Returns:
        Next available IP address or None if subnet is full
    """
    try:
        net, is_ipv6 = parse_cidr(subnet)
        used_set = {ipaddress.ip_address(ip) for ip in used_ips}

        for ip in net.hosts():
            if ip not in used_set:
                return str(ip)

        return None
    except (ValueError, TypeError):
        return None


def calculate_subnet_overlap(subnet1: str, subnet2: str) -> bool:
    """
    Check if two subnets overlap.

    Args:
        subnet1: First subnet in CIDR notation
        subnet2: Second subnet in CIDR notation

    Returns:
        True if subnets overlap, False otherwise
    """
    try:
        net1 = ipaddress.ip_network(subnet1, strict=False)
        net2 = ipaddress.ip_network(subnet2, strict=False)
        return net1.overlaps(net2)
    except (ValueError, TypeError):
        return False
