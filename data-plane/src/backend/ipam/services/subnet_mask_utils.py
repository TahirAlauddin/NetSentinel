"""
Subnet Mask Utilities

Provides functions for calculating and displaying subnet mask information.
"""

import ipaddress
from typing import Dict, List


def get_subnet_mask_info(prefix_length: int, is_ipv6: bool = False) -> Dict:
    """
    Get detailed information about a subnet mask for a given prefix length.

    Args:
        prefix_length: CIDR prefix length (0-32 for IPv4, 0-128 for IPv6)
        is_ipv6: Whether this is an IPv6 subnet mask

    Returns:
        Dictionary containing subnet mask information:
        - bitmask: Prefix length
        - netmask: Subnet mask in dotted decimal notation (IPv4) or hex (IPv6)
        - wildcard_mask: Wildcard mask (inverse of netmask)
        - binary: Binary representation
        - subnets: Number of possible subnets
        - hosts: Number of usable hosts
        - subnet_bits: Number of subnet bits
        - host_bits: Number of host bits
    """
    if is_ipv6:
        max_prefix = 128
    else:
        max_prefix = 32

    if prefix_length < 0 or prefix_length > max_prefix:
        raise ValueError(f"Prefix length must be between 0 and {max_prefix}")

    # Calculate host bits
    host_bits = max_prefix - prefix_length
    subnet_bits = prefix_length

    # Calculate number of hosts (2^host_bits)
    total_hosts = 2**host_bits if host_bits <= 64 else float("inf")

    # For IPv4, exclude network and broadcast addresses
    if is_ipv6:
        usable_hosts = total_hosts
    else:
        usable_hosts = max(0, total_hosts - 2) if total_hosts != float("inf") else total_hosts

    # Calculate number of subnets (2^subnet_bits)
    # For reference purposes, we show how many /32 subnets can fit in this prefix
    if is_ipv6:
        subnets = 2 ** (128 - prefix_length) if prefix_length < 128 else 1
    else:
        subnets = 2 ** (32 - prefix_length) if prefix_length < 32 else 1

    # Generate netmask
    if is_ipv6:
        # For IPv6, create a network with the prefix length
        net = ipaddress.IPv6Network(f"::/{prefix_length}", strict=False)
        netmask = str(net.netmask)
        wildcard_mask = "Not applicable for IPv6"
        binary = _ipv6_to_binary(net.netmask)
    else:
        # For IPv4, create a network with the prefix length
        net = ipaddress.IPv4Network(f"0.0.0.0/{prefix_length}", strict=False)
        netmask = str(net.netmask)
        # Calculate wildcard mask (inverse of netmask)
        wildcard_int = 0xFFFFFFFF ^ int(net.netmask)
        wildcard_mask = str(ipaddress.IPv4Address(wildcard_int))
        binary = _ipv4_to_binary(net.netmask)

    return {
        "bitmask": prefix_length,
        "netmask": netmask,
        "wildcard_mask": wildcard_mask,
        "binary": binary,
        "subnets": subnets,
        "hosts": usable_hosts if usable_hosts != float("inf") else "Unlimited",
        "subnet_bits": subnet_bits,
        "host_bits": host_bits,
        "is_ipv6": is_ipv6,
    }


def _ipv4_to_binary(ip: ipaddress.IPv4Address) -> str:
    """Convert IPv4 address to binary string with dots."""
    binary_str = format(int(ip), "032b")
    return ".".join([binary_str[i : i + 8] for i in range(0, 32, 8)])


def _ipv6_to_binary(ip: ipaddress.IPv6Address) -> str:
    """Convert IPv6 address to binary string with colons (hex format for readability)."""
    # For IPv6, show hex representation instead of full binary (too long)
    hex_str = format(int(ip), "032x")
    return ":".join([hex_str[i : i + 4] for i in range(0, 32, 4)])


def get_all_subnet_masks(
    is_ipv6: bool = False, min_prefix: int = None, max_prefix: int = None
) -> List[Dict]:
    """
    Get subnet mask information for all prefix lengths.

    Args:
        is_ipv6: Whether to generate IPv6 subnet masks
        min_prefix: Minimum prefix length (default: 0 for IPv4, 0 for IPv6)
        max_prefix: Maximum prefix length (default: 32 for IPv4, 128 for IPv6)

    Returns:
        List of dictionaries containing subnet mask information
    """
    if is_ipv6:
        default_min = 0
        default_max = 128
    else:
        default_min = 0
        default_max = 32

    min_prefix = min_prefix if min_prefix is not None else default_min
    max_prefix = max_prefix if max_prefix is not None else default_max

    masks = []
    # Generate from highest to lowest prefix length (most specific to least specific)
    for prefix in range(max_prefix, min_prefix - 1, -1):
        try:
            mask_info = get_subnet_mask_info(prefix, is_ipv6)
            masks.append(mask_info)
        except ValueError:
            continue

    return masks


def get_common_subnet_masks(is_ipv6: bool = False) -> List[Dict]:
    """
    Get subnet mask information for commonly used prefix lengths.

    Args:
        is_ipv6: Whether to generate IPv6 subnet masks

    Returns:
        List of dictionaries containing subnet mask information for common prefix lengths
    """
    if is_ipv6:
        # Common IPv6 prefix lengths
        common_prefixes = [
            128,
            127,
            126,
            125,
            124,
            120,
            112,
            108,
            104,
            96,
            80,
            64,
            48,
            32,
            24,
            16,
            8,
            0,
        ]
    else:
        # Common IPv4 prefix lengths (from /32 to /8)
        common_prefixes = [
            32,
            31,
            30,
            29,
            28,
            27,
            26,
            25,
            24,
            23,
            22,
            21,
            20,
            19,
            18,
            17,
            16,
            15,
            14,
            13,
            12,
            11,
            10,
            9,
            8,
            7,
            6,
            5,
            4,
            3,
            2,
            1,
            0,
        ]

    masks = []
    for prefix in common_prefixes:
        try:
            mask_info = get_subnet_mask_info(prefix, is_ipv6)
            masks.append(mask_info)
        except ValueError:
            continue

    return masks
