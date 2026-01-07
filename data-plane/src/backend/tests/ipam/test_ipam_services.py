"""
Tests for IPAM service utilities.
"""

import pytest

from ipam.services.subnet_utils import (
    calculate_subnet_overlap,
    get_network_info,
    get_next_available_ip,
    is_ip_in_subnet,
    parse_cidr,
)


class TestParseCIDR:
    """Test cases for parse_cidr function."""

    def test_parse_ipv4_cidr(self):
        """Test parsing IPv4 CIDR notation."""
        net, is_ipv6 = parse_cidr("192.168.1.0/24")
        assert is_ipv6 is False
        assert str(net.network_address) == "192.168.1.0"
        assert net.prefixlen == 24

    def test_parse_ipv6_cidr(self):
        """Test parsing IPv6 CIDR notation."""
        net, is_ipv6 = parse_cidr("2001:db8::/32")
        assert is_ipv6 is True
        assert str(net.network_address) == "2001:db8::"
        assert net.prefixlen == 32

    def test_parse_invalid_cidr_raises_error(self):
        """Test that invalid CIDR notation raises ValueError."""
        with pytest.raises(ValueError, match="Invalid CIDR notation"):
            parse_cidr("invalid-cidr")

    def test_parse_cidr_without_strict(self):
        """Test parsing CIDR with host bits set (non-strict mode)."""
        # This should work because we use strict=False
        net, is_ipv6 = parse_cidr("192.168.1.1/24")
        assert is_ipv6 is False
        assert net.prefixlen == 24


class TestGetNetworkInfo:
    """Test cases for get_network_info function."""

    def test_get_network_info_ipv4(self):
        """Test getting network info for IPv4 subnet."""
        info = get_network_info("192.168.1.0/24")
        assert info["network"] == "192.168.1.0"
        assert info["netmask"] == "255.255.255.0"
        assert info["is_ipv6"] is False
        assert info["prefix_length"] == 24
        assert info["total_hosts"] == 256
        assert info["usable_hosts"] == 254
        assert info["first_ip"] == "192.168.1.1"
        assert info["last_ip"] == "192.168.1.254"
        assert info["broadcast"] == "192.168.1.255"

    def test_get_network_info_ipv6(self):
        """Test getting network info for IPv6 subnet."""
        info = get_network_info("2001:db8::/32")
        assert info["network"] == "2001:db8::"
        assert info["is_ipv6"] is True
        assert info["prefix_length"] == 32
        assert "broadcast" not in info  # IPv6 doesn't have broadcast

    def test_get_network_info_small_subnet(self):
        """Test getting network info for a /30 subnet (4 addresses)."""
        info = get_network_info("192.168.1.0/30")
        assert info["total_hosts"] == 4
        assert info["usable_hosts"] == 2
        assert info["first_ip"] == "192.168.1.1"
        assert info["last_ip"] == "192.168.1.2"

    def test_get_network_info_single_host(self):
        """Test getting network info for a /32 subnet (single host)."""
        info = get_network_info("192.168.1.1/32")
        assert info["total_hosts"] == 1
        assert info["usable_hosts"] == 0


class TestIsIPInSubnet:
    """Test cases for is_ip_in_subnet function."""

    def test_ip_in_subnet_ipv4(self):
        """Test that IP is correctly identified as being in subnet."""
        assert is_ip_in_subnet("192.168.1.10", "192.168.1.0/24") is True
        assert is_ip_in_subnet("192.168.1.1", "192.168.1.0/24") is True
        assert is_ip_in_subnet("192.168.1.254", "192.168.1.0/24") is True

    def test_ip_not_in_subnet_ipv4(self):
        """Test that IP is correctly identified as not being in subnet."""
        assert is_ip_in_subnet("192.168.2.10", "192.168.1.0/24") is False
        assert is_ip_in_subnet("10.0.0.1", "192.168.1.0/24") is False

    def test_ip_in_subnet_ipv6(self):
        """Test that IPv6 IP is correctly identified as being in subnet."""
        assert is_ip_in_subnet("2001:db8::1", "2001:db8::/32") is True
        assert is_ip_in_subnet("2001:db8:0:1::1", "2001:db8::/32") is True

    def test_ip_not_in_subnet_ipv6(self):
        """Test that IPv6 IP is correctly identified as not being in subnet."""
        assert is_ip_in_subnet("2001:db9::1", "2001:db8::/32") is False

    def test_invalid_ip_returns_false(self):
        """Test that invalid IP returns False."""
        assert is_ip_in_subnet("invalid-ip", "192.168.1.0/24") is False
        assert is_ip_in_subnet("192.168.1.10", "invalid-subnet") is False


class TestGetNextAvailableIP:
    """Test cases for get_next_available_ip function."""

    def test_get_next_available_ip_empty_subnet(self):
        """Test getting next available IP in empty subnet."""
        ip = get_next_available_ip("192.168.1.0/24", [])
        assert ip == "192.168.1.1"  # First usable IP

    def test_get_next_available_ip_with_used_ips(self):
        """Test getting next available IP when some IPs are used."""
        used_ips = ["192.168.1.1", "192.168.1.2", "192.168.1.5"]
        ip = get_next_available_ip("192.168.1.0/24", used_ips)
        assert ip == "192.168.1.3"

    def test_get_next_available_ip_full_subnet(self):
        """Test that None is returned when subnet is full."""
        # Create list of all usable IPs in /24 subnet (254 IPs)
        used_ips = [f"192.168.1.{i}" for i in range(1, 255)]
        ip = get_next_available_ip("192.168.1.0/24", used_ips)
        assert ip is None

    def test_get_next_available_ip_ipv6(self):
        """Test getting next available IPv6 address."""
        ip = get_next_available_ip("2001:db8::/120", [])
        assert ip is not None
        assert ip.startswith("2001:db8::")

    def test_get_next_available_ip_invalid_subnet(self):
        """Test that invalid subnet returns None."""
        ip = get_next_available_ip("invalid-subnet", [])
        assert ip is None

    def test_get_next_available_ip_small_subnet(self):
        """Test getting next available IP in /30 subnet."""
        used_ips = ["192.168.1.1"]
        ip = get_next_available_ip("192.168.1.0/30", used_ips)
        assert ip == "192.168.1.2"


class TestCalculateSubnetOverlap:
    """Test cases for calculate_subnet_overlap function."""

    def test_overlapping_subnets_ipv4(self):
        """Test that overlapping IPv4 subnets are detected."""
        assert calculate_subnet_overlap("192.168.1.0/24", "192.168.1.0/25") is True
        assert calculate_subnet_overlap("192.168.1.0/24", "192.168.1.128/25") is True
        assert calculate_subnet_overlap("192.168.0.0/16", "192.168.1.0/24") is True

    def test_non_overlapping_subnets_ipv4(self):
        """Test that non-overlapping IPv4 subnets are detected."""
        assert calculate_subnet_overlap("192.168.1.0/24", "192.168.2.0/24") is False
        assert calculate_subnet_overlap("10.0.0.0/8", "192.168.0.0/16") is False

    def test_identical_subnets(self):
        """Test that identical subnets are detected as overlapping."""
        assert calculate_subnet_overlap("192.168.1.0/24", "192.168.1.0/24") is True

    def test_overlapping_subnets_ipv6(self):
        """Test that overlapping IPv6 subnets are detected."""
        assert calculate_subnet_overlap("2001:db8::/32", "2001:db8::/48") is True
        assert calculate_subnet_overlap("2001:db8::/32", "2001:db8:1::/48") is True

    def test_non_overlapping_subnets_ipv6(self):
        """Test that non-overlapping IPv6 subnets are detected."""
        assert calculate_subnet_overlap("2001:db8::/32", "2001:db9::/32") is False

    def test_mixed_ipv4_ipv6(self):
        """Test that IPv4 and IPv6 subnets don't overlap."""
        assert calculate_subnet_overlap("192.168.1.0/24", "2001:db8::/32") is False

    def test_invalid_subnet_returns_false(self):
        """Test that invalid subnet returns False."""
        assert calculate_subnet_overlap("invalid-subnet", "192.168.1.0/24") is False
        assert calculate_subnet_overlap("192.168.1.0/24", "invalid-subnet") is False
