"""
Tests for IP Address Search & Discovery functionality.
"""

import pytest
from rest_framework import status

from infrastructure.models import Location
from ipam.models import DNSRecord, DNSZone, IPAddress, Subnet, SubnetGroup
from ipam.services.ip_search import (
    detect_ip_conflicts,
    find_available_ips_in_subnet,
    get_ip_details,
    search_by_hostname,
    search_ip_addresses,
    search_ip_range,
)


@pytest.mark.django_db
class TestIPSearchService:
    """Test cases for IP search service functions."""

    @pytest.fixture
    def subnet(self):
        """Create a test subnet."""
        location = Location.objects.create(name="Test Location", city="Test City")
        group = SubnetGroup.objects.create(name="Test Group")
        return Subnet.objects.create(
            network="192.168.1.0/24",
            group=group,
            location=location,
        )

    @pytest.fixture
    def ip_addresses(self, subnet):
        """Create test IP addresses."""
        return [
            IPAddress.objects.create(
                address="192.168.1.10",
                subnet=subnet,
                status="assigned",
                description="Web server",
            ),
            IPAddress.objects.create(
                address="192.168.1.20",
                subnet=subnet,
                status="reserved",
                description="Database server",
            ),
            IPAddress.objects.create(
                address="192.168.1.30",
                subnet=subnet,
                status="available",
            ),
        ]

    def test_search_by_ip_address(self, ip_addresses):
        """Test searching by exact IP address."""
        results = search_ip_addresses(query="192.168.1.10")

        assert len(results) == 1
        assert results[0].address == "192.168.1.10"

    def test_search_by_description(self, ip_addresses):
        """Test searching by description."""
        results = search_ip_addresses(query="Web server")

        assert len(results) >= 1
        assert any(ip.description == "Web server" for ip in results)

    def test_search_by_status(self, ip_addresses):
        """Test filtering by status."""
        results = search_ip_addresses(status="assigned")

        assert len(results) >= 1
        assert all(ip.status == "assigned" for ip in results)

    def test_search_by_subnet(self, subnet, ip_addresses):
        """Test filtering by subnet."""
        results = search_ip_addresses(subnet_id=subnet.id)

        assert len(results) == 3
        assert all(ip.subnet == subnet for ip in results)

    def test_search_ip_range(self, subnet, ip_addresses):
        """Test searching IP addresses in a range."""
        results = search_ip_range(start_ip="192.168.1.10", end_ip="192.168.1.25")

        assert len(results) >= 2
        addresses = [ip.address for ip in results]
        assert "192.168.1.10" in addresses
        assert "192.168.1.20" in addresses

    def test_search_ip_range_with_subnet_filter(self, subnet, ip_addresses):
        """Test range search with subnet filter."""
        # Create another subnet
        location = Location.objects.create(name="Location 2", city="City 2")
        group = SubnetGroup.objects.create(name="Group 2")
        subnet2 = Subnet.objects.create(
            network="10.0.0.0/24",
            group=group,
            location=location,
        )
        IPAddress.objects.create(address="10.0.0.10", subnet=subnet2, status="assigned")

        results = search_ip_range(
            start_ip="192.168.1.10",
            end_ip="192.168.1.25",
            subnet_id=subnet.id,
        )

        # Should only return IPs from subnet, not subnet2
        assert all(ip.subnet == subnet for ip in results)

    def test_search_by_hostname(self, subnet):
        """Test searching by hostname via DNS records."""
        # Create DNS zone and record
        location = Location.objects.create(name="Test Location", city="Test City")
        zone = DNSZone.objects.create(name="example.com", location=location)
        IPAddress.objects.create(
            address="192.168.1.100",
            subnet=subnet,
            status="assigned",
        )
        DNSRecord.objects.create(
            zone=zone,
            name="server1",
            record_type="A",
            value="192.168.1.100",
            ttl=3600,
        )

        results = search_by_hostname("server1")

        assert len(results) >= 1
        assert any(ip.address == "192.168.1.100" for ip in results)

    def test_detect_ip_conflicts(self, subnet):
        """Test detecting IP address conflicts."""
        # Create IP in subnet
        IPAddress.objects.create(
            address="192.168.1.50",
            subnet=subnet,
            status="assigned",
        )

        # Since IPAddress has unique constraint on address, we can only have one
        # Conflict detection checks if the IP exists
        conflicts = detect_ip_conflicts("192.168.1.50")

        assert len(conflicts) == 1
        assert conflicts[0]["subnet_id"] == subnet.id
        assert conflicts[0]["ip_address"] == "192.168.1.50"

    def test_detect_ip_conflicts_exclude_subnet(self, subnet):
        """Test conflict detection with excluded subnet."""
        IPAddress.objects.create(
            address="192.168.1.60",
            subnet=subnet,
            status="assigned",
        )

        # Since IPAddress has unique constraint, we can't create duplicate
        # When excluding the subnet, should return empty (no conflicts in other subnets)
        conflicts = detect_ip_conflicts("192.168.1.60", exclude_subnet_id=subnet.id)

        # Should return empty since we excluded the only subnet with this IP
        assert len(conflicts) == 0

    def test_get_ip_details_existing(self, subnet):
        """Test getting details for existing IP address."""
        IPAddress.objects.create(
            address="192.168.1.70",
            subnet=subnet,
            status="assigned",
            description="Test server",
        )

        details = get_ip_details("192.168.1.70")

        assert details["exists"] is True
        assert details["ip_address"] == "192.168.1.70"
        assert details["status"] == "assigned"
        assert details["subnet"]["id"] == subnet.id

    def test_get_ip_details_not_found(self):
        """Test getting details for non-existent IP address."""
        details = get_ip_details("192.168.1.999")

        assert details["exists"] is False
        assert "not found" in details["message"].lower()

    def test_find_available_ips_in_subnet(self, subnet):
        """Test finding available IP addresses in subnet."""
        # Create some used IPs
        IPAddress.objects.create(address="192.168.1.1", subnet=subnet, status="assigned")
        IPAddress.objects.create(address="192.168.1.2", subnet=subnet, status="reserved")

        available = find_available_ips_in_subnet(subnet.id, count=5)

        assert len(available) == 5
        assert "192.168.1.1" not in available
        assert "192.168.1.2" not in available
        # All should be valid IPs in the subnet
        assert all("192.168.1." in ip for ip in available)


@pytest.mark.api
@pytest.mark.django_db
class TestIPSearchViews:
    """Test cases for IP search API endpoints."""

    @pytest.fixture
    def subnet(self):
        """Create a test subnet."""
        location = Location.objects.create(name="Test Location", city="Test City")
        group = SubnetGroup.objects.create(name="Test Group")
        return Subnet.objects.create(
            network="192.168.1.0/24",
            group=group,
            location=location,
        )

    @pytest.fixture
    def ip_address(self, subnet):
        """Create a test IP address."""
        return IPAddress.objects.create(
            address="192.168.1.10",
            subnet=subnet,
            status="assigned",
            description="Test server",
        )

    def test_search_endpoint(self, authenticated_api_client, ip_address):
        """Test GET /api/v1/ipam/ip-addresses/search/ endpoint."""
        response = authenticated_api_client.get("/api/v1/ipam/ip-addresses/search/?q=192.168.1.10")

        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        assert len(response.data) >= 1
        assert response.data[0]["address"] == "192.168.1.10"

    def test_search_endpoint_with_filters(self, authenticated_api_client, subnet, ip_address):
        """Test search endpoint with multiple filters."""
        response = authenticated_api_client.get(
            f"/api/v1/ipam/ip-addresses/search/?status=assigned&subnet={subnet.id}"
        )

        assert response.status_code == status.HTTP_200_OK
        assert all(ip["status"] == "assigned" for ip in response.data)

    def test_range_search_endpoint(self, authenticated_api_client, subnet):
        """Test GET /api/v1/ipam/ip-addresses/range/ endpoint."""
        IPAddress.objects.create(address="192.168.1.10", subnet=subnet, status="assigned")
        IPAddress.objects.create(address="192.168.1.20", subnet=subnet, status="assigned")

        response = authenticated_api_client.get(
            "/api/v1/ipam/ip-addresses/range/?start=192.168.1.10&end=192.168.1.25"
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 2

    def test_range_search_missing_params(self, authenticated_api_client):
        """Test range search endpoint with missing parameters."""
        response = authenticated_api_client.get("/api/v1/ipam/ip-addresses/range/")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_search_by_hostname_endpoint(self, authenticated_api_client, subnet):
        """Test GET /api/v1/ipam/ip-addresses/hostname/ endpoint."""
        location = Location.objects.create(name="Test Location", city="Test City")
        zone = DNSZone.objects.create(name="example.com", location=location)
        IPAddress.objects.create(
            address="192.168.1.100",
            subnet=subnet,
            status="assigned",
        )
        DNSRecord.objects.create(
            zone=zone,
            name="server1",
            record_type="A",
            value="192.168.1.100",
            ttl=3600,
        )

        response = authenticated_api_client.get(
            "/api/v1/ipam/ip-addresses/hostname/?hostname=server1"
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_ip_details_endpoint(self, authenticated_api_client, ip_address):
        """Test GET /api/v1/ipam/ip-addresses/{ip}/details/ endpoint."""
        response = authenticated_api_client.get(
            f"/api/v1/ipam/ip-addresses/{ip_address.address}/details/"
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["exists"] is True
        assert response.data["ip_address"] == ip_address.address

    def test_ip_conflicts_endpoint(self, authenticated_api_client, subnet):
        """Test GET /api/v1/ipam/ip-addresses/{ip}/conflicts/ endpoint."""
        IPAddress.objects.create(address="192.168.1.50", subnet=subnet, status="assigned")

        # Since IPAddress has unique constraint on address, we can only have one
        # Conflict detection will return the existing IP
        response = authenticated_api_client.get("/api/v1/ipam/ip-addresses/192.168.1.50/conflicts/")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["ip_address"] == "192.168.1.50"

    def test_find_available_endpoint(self, authenticated_api_client, subnet):
        """Test GET /api/v1/ipam/ip-addresses/find-available/ endpoint."""
        # Create some used IPs
        IPAddress.objects.create(address="192.168.1.1", subnet=subnet, status="assigned")

        response = authenticated_api_client.get(
            f"/api/v1/ipam/ip-addresses/find-available/?subnet={subnet.id}&count=5"
        )

        assert response.status_code == status.HTTP_200_OK
        assert "available_ips" in response.data
        assert len(response.data["available_ips"]) == 5
        assert "192.168.1.1" not in response.data["available_ips"]
