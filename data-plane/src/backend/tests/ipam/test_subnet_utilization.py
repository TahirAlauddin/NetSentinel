"""
Tests for Subnet Utilization Analytics.
"""

import pytest
from rest_framework import status

from infrastructure.models import Location
from ipam.models import IPAddress, Subnet, SubnetGroup
from ipam.services.subnet_utilization import (
    calculate_subnet_capacity,
    calculate_subnet_utilization,
    get_all_subnets_utilization,
    get_utilization_summary,
)


@pytest.mark.django_db
class TestSubnetUtilizationService:
    """Test cases for subnet utilization service functions."""

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

    def test_calculate_utilization_empty_subnet(self, subnet):
        """Test utilization calculation for empty subnet."""
        utilization = calculate_subnet_utilization(subnet)

        assert utilization["total_hosts"] == 256
        assert utilization["usable_hosts"] == 254  # Exclude network and broadcast
        assert utilization["used_ips"] == 0
        assert utilization["available_ips"] == 254
        assert utilization["utilization_percentage"] == 0.0
        assert utilization["status"] == "healthy"

    def test_calculate_utilization_with_ips(self, subnet):
        """Test utilization calculation with assigned IPs."""
        # Create some IP addresses
        IPAddress.objects.create(address="192.168.1.1", subnet=subnet, status="assigned")
        IPAddress.objects.create(address="192.168.1.2", subnet=subnet, status="reserved")
        IPAddress.objects.create(address="192.168.1.3", subnet=subnet, status="assigned")
        IPAddress.objects.create(address="192.168.1.4", subnet=subnet, status="available")

        utilization = calculate_subnet_utilization(subnet)

        assert utilization["used_ips"] == 3  # 3 non-available IPs
        assert utilization["available_ips"] == 251  # 254 - 3
        assert utilization["assigned_ips"] == 2
        assert utilization["reserved_ips"] == 1
        assert utilization["utilization_percentage"] > 0

    def test_calculate_utilization_critical_status(self, subnet):
        """Test that high utilization returns critical status."""
        # Create many IPs to reach >90% utilization
        for i in range(1, 230):  # ~90% of 254
            IPAddress.objects.create(
                address=f"192.168.1.{i}",
                subnet=subnet,
                status="assigned",
            )

        utilization = calculate_subnet_utilization(subnet)
        assert utilization["status"] == "critical"
        assert utilization["utilization_percentage"] >= 90

    def test_calculate_utilization_warning_status(self, subnet):
        """Test that moderate-high utilization returns warning status."""
        # Create IPs to reach ~80% utilization
        for i in range(1, 204):  # ~80% of 254
            IPAddress.objects.create(
                address=f"192.168.1.{i}",
                subnet=subnet,
                status="assigned",
            )

        utilization = calculate_subnet_utilization(subnet)
        assert utilization["status"] in ["warning", "critical"]
        assert utilization["utilization_percentage"] >= 75

    def test_calculate_capacity_with_growth(self, subnet):
        """Test capacity planning with growth rate."""
        # Create some initial IPs
        for i in range(1, 51):  # ~20% utilization
            IPAddress.objects.create(
                address=f"192.168.1.{i}",
                subnet=subnet,
                status="assigned",
            )

        capacity = calculate_subnet_capacity(subnet, growth_rate=0.05, months=12)

        assert "projected_usage" in capacity
        assert len(capacity["projected_usage"]) == 12
        assert capacity["growth_rate"] == 0.05
        # Projected usage should increase over time
        assert (
            capacity["projected_usage"][11]["projected_used"]
            > capacity["projected_usage"][0]["projected_used"]
        )

    def test_get_all_subnets_utilization(self, subnet):
        """Test getting utilization for all subnets."""
        # Create another subnet
        location = Location.objects.create(name="Location 2", city="City 2")
        group = SubnetGroup.objects.create(name="Group 2")
        Subnet.objects.create(
            network="10.0.0.0/24",
            group=group,
            location=location,
        )

        # Add some IPs to first subnet
        IPAddress.objects.create(address="192.168.1.1", subnet=subnet, status="assigned")

        utilizations = get_all_subnets_utilization()

        assert len(utilizations) == 2
        # Should be sorted by utilization (descending)
        assert (
            utilizations[0]["utilization_percentage"] >= utilizations[1]["utilization_percentage"]
        )

    def test_get_all_subnets_utilization_with_filters(self, subnet):
        """Test getting utilization with filters."""
        location = Location.objects.create(name="Location 2", city="City 2")
        group = SubnetGroup.objects.create(name="Group 2")
        Subnet.objects.create(
            network="10.0.0.0/24",
            group=group,
            location=location,
        )

        utilizations = get_all_subnets_utilization(filters={"location": location.id})
        assert len(utilizations) == 1
        assert utilizations[0]["subnet_network"] == "10.0.0.0/24"

    def test_get_all_subnets_utilization_with_threshold(self, subnet):
        """Test getting utilization with threshold filter."""
        # Create IPs to reach high utilization
        for i in range(1, 200):
            IPAddress.objects.create(
                address=f"192.168.1.{i}",
                subnet=subnet,
                status="assigned",
            )

        utilizations = get_all_subnets_utilization(threshold=75.0)
        # Should only return subnets with >= 75% utilization
        for util in utilizations:
            assert util["utilization_percentage"] >= 75.0

    def test_get_utilization_summary(self, subnet):
        """Test getting overall utilization summary."""
        # Create some IPs
        for i in range(1, 51):
            IPAddress.objects.create(
                address=f"192.168.1.{i}",
                subnet=subnet,
                status="assigned",
            )

        summary = get_utilization_summary()

        assert "total_subnets" in summary
        assert "total_usable_hosts" in summary
        assert "total_used_ips" in summary
        assert "overall_utilization_percentage" in summary
        assert "subnets_by_status" in summary
        assert summary["total_subnets"] >= 1


@pytest.mark.api
@pytest.mark.django_db
class TestSubnetUtilizationViews:
    """Test cases for subnet utilization API endpoints."""

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

    def test_get_subnet_utilization(self, authenticated_api_client, subnet):
        """Test GET /api/v1/ipam/subnets/{id}/utilization/ endpoint."""
        response = authenticated_api_client.get(f"/api/v1/ipam/subnets/{subnet.id}/utilization/")

        assert response.status_code == status.HTTP_200_OK
        assert "utilization_percentage" in response.data
        assert "total_hosts" in response.data
        assert "used_ips" in response.data

    def test_get_subnet_capacity(self, authenticated_api_client, subnet):
        """Test GET /api/v1/ipam/subnets/{id}/capacity/ endpoint."""
        response = authenticated_api_client.get(
            f"/api/v1/ipam/subnets/{subnet.id}/capacity/?growth_rate=0.05&months=12"
        )

        assert response.status_code == status.HTTP_200_OK
        assert "projected_usage" in response.data
        assert len(response.data["projected_usage"]) == 12

    def test_get_all_subnets_utilization(self, authenticated_api_client, subnet):
        """Test GET /api/v1/ipam/subnets/utilization_all/ endpoint."""
        # Create some IPs
        IPAddress.objects.create(address="192.168.1.1", subnet=subnet, status="assigned")

        response = authenticated_api_client.get("/api/v1/ipam/subnets/utilization_all/")

        assert response.status_code == status.HTTP_200_OK
        assert isinstance(response.data, list)
        assert len(response.data) >= 1

    def test_get_utilization_summary(self, authenticated_api_client, subnet):
        """Test GET /api/v1/ipam/subnets/utilization_summary/ endpoint."""
        response = authenticated_api_client.get("/api/v1/ipam/subnets/utilization_summary/")

        assert response.status_code == status.HTTP_200_OK
        assert "total_subnets" in response.data
        assert "overall_utilization_percentage" in response.data
