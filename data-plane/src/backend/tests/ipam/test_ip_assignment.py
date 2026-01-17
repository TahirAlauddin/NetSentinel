"""
Tests for IP Address Assignment functionality.
"""

import pytest
from rest_framework import status

from assets.models import Asset, AssetCategory
from infrastructure.models import Location
from ipam.models import IPAddress, Subnet, SubnetGroup
from ipam.services.ip_assignment import (
    assign_ip_to_asset,
    auto_assign_ip_from_subnet,
    change_ip_status,
    release_ip_from_asset,
)
from users.models import User


@pytest.mark.django_db
class TestIPAssignmentService:
    """Test cases for IP assignment service functions."""

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
            status="available",
        )

    @pytest.fixture
    def asset(self):
        """Create a test asset."""
        category = AssetCategory.objects.create(name="Network Device")
        location = Location.objects.create(name="Test Location", city="Test City")
        return Asset.objects.create(
            name="Test Router",
            category=category,
            location=location,
        )

    @pytest.fixture
    def user(self):
        """Create a test user."""
        return User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
        )

    def test_assign_ip_to_asset_success(self, ip_address, asset, user):
        """Test assigning an IP address to an asset."""
        history = assign_ip_to_asset(
            ip_address=ip_address,
            asset=asset,
            assigned_by=user,
            reason="Test assignment",
        )

        ip_address.refresh_from_db()
        assert ip_address.status == "assigned"
        assert ip_address.assigned_to_asset == asset
        assert ip_address.assigned_by == user
        assert ip_address.assigned_at is not None
        assert history.action == "assigned"
        assert history.assigned_to_asset == asset

    def test_assign_ip_to_asset_fails_when_not_available(self, subnet, asset, user):
        """Test that assigning fails when IP is not available."""
        ip_address = IPAddress.objects.create(
            address="192.168.1.20",
            subnet=subnet,
            status="assigned",  # Already assigned
        )

        with pytest.raises(ValueError, match="not available for assignment"):
            assign_ip_to_asset(
                ip_address=ip_address,
                asset=asset,
                assigned_by=user,
            )

    def test_reassign_ip_to_different_asset(self, subnet, asset, user):
        """Test reassigning an IP address to a different asset."""
        # Create first asset and assign
        ip_address = IPAddress.objects.create(
            address="192.168.1.30",
            subnet=subnet,
            status="available",
        )
        asset1 = asset
        asset2 = Asset.objects.create(
            name="Test Switch",
            category=asset.category,
            location=asset.location,
        )

        # First assignment
        assign_ip_to_asset(ip_address, asset1, user)
        ip_address.refresh_from_db()
        assert ip_address.assigned_to_asset == asset1

        # Reassign to asset2
        history = assign_ip_to_asset(ip_address, asset2, user, reason="Reassignment")
        ip_address.refresh_from_db()
        assert ip_address.assigned_to_asset == asset2
        assert history.action == "reassigned"
        assert history.previous_asset == asset1

    def test_release_ip_from_asset(self, subnet, asset, user):
        """Test releasing an IP address from an asset."""
        ip_address = IPAddress.objects.create(
            address="192.168.1.40",
            subnet=subnet,
            status="assigned",
            assigned_to_asset=asset,
            assigned_by=user,
        )

        history = release_ip_from_asset(
            ip_address=ip_address,
            released_by=user,
            reason="Asset decommissioned",
        )

        ip_address.refresh_from_db()
        assert ip_address.status == "available"
        assert ip_address.assigned_to_asset is None
        assert ip_address.assigned_by is None
        assert ip_address.assigned_at is None
        assert history.action == "released"
        assert history.previous_asset == asset

    def test_release_ip_fails_when_not_assigned(self, ip_address, user):
        """Test that releasing fails when IP is not assigned."""
        with pytest.raises(ValueError, match="not currently assigned"):
            release_ip_from_asset(ip_address, user)

    def test_auto_assign_ip_from_subnet(self, subnet, asset, user):
        """Test automatic IP assignment from subnet."""
        # Create some used IPs
        IPAddress.objects.create(address="192.168.1.1", subnet=subnet, status="assigned")
        IPAddress.objects.create(address="192.168.1.2", subnet=subnet, status="reserved")

        ip_address, history = auto_assign_ip_from_subnet(
            subnet=subnet,
            asset=asset,
            assigned_by=user,
            reason="Auto assignment",
        )

        assert ip_address.status == "assigned"
        assert ip_address.assigned_to_asset == asset
        assert ip_address.address not in ["192.168.1.1", "192.168.1.2"]
        assert history.action == "assigned"

    def test_auto_assign_fails_when_subnet_full(self, subnet, asset, user):
        """Test that auto-assign fails when subnet is full."""
        # Create IP addresses for all usable IPs in the subnet (192.168.1.1 to 192.168.1.254)
        # We'll create a few to simulate a full subnet scenario
        # In practice, we'd need to fill all 254 addresses, but for testing we'll just
        # ensure no available IPs exist by marking all as used
        from ipaddress import ip_network

        network = ip_network(subnet.network, strict=False)
        # Get all host addresses (excluding network and broadcast)
        hosts = list(network.hosts())

        # Create IP addresses for all hosts to simulate full subnet
        for host in hosts:
            IPAddress.objects.get_or_create(
                address=str(host),
                defaults={
                    "subnet": subnet,
                    "status": "assigned",  # Mark all as assigned
                },
            )

        # Now try to auto-assign - should fail
        with pytest.raises(ValueError, match="No available IP addresses"):
            auto_assign_ip_from_subnet(
                subnet=subnet,
                asset=asset,
                assigned_by=user,
                reason="Should fail",
            )

    def test_change_ip_status(self, ip_address, user):
        """Test changing IP address status."""
        assert ip_address.status == "available"

        history = change_ip_status(
            ip_address=ip_address,
            new_status="reserved",
            changed_by=user,
            reason="Reserved for future use",
        )

        ip_address.refresh_from_db()
        assert ip_address.status == "reserved"
        assert history.action == "status_changed"
        assert history.previous_status == "available"
        assert history.new_status == "reserved"

    def test_change_ip_status_invalid(self, ip_address, user):
        """Test that changing to invalid status fails."""
        with pytest.raises(ValueError, match="Invalid status"):
            change_ip_status(ip_address, "invalid_status", user)


@pytest.mark.api
@pytest.mark.django_db
class TestIPAssignmentViews:
    """Test cases for IP assignment API endpoints."""

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
            status="available",
        )

    @pytest.fixture
    def asset(self):
        """Create a test asset."""
        category = AssetCategory.objects.create(name="Network Device")
        location = Location.objects.create(name="Test Location", city="Test City")
        return Asset.objects.create(
            name="Test Router",
            category=category,
            location=location,
        )

    def test_assign_ip_endpoint_success(self, authenticated_api_client, ip_address, asset):
        """Test POST /api/v1/ipam/ip-addresses/{id}/assign/ endpoint."""
        data = {
            "asset_id": asset.id,
            "reason": "Test assignment",
        }
        response = authenticated_api_client.post(
            f"/api/v1/ipam/ip-addresses/{ip_address.id}/assign/",
            data,
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "assigned"
        assert response.data["assigned_to_asset"] == asset.id

    def test_assign_ip_endpoint_missing_asset_id(self, authenticated_api_client, ip_address):
        """Test assign endpoint fails without asset_id."""
        response = authenticated_api_client.post(
            f"/api/v1/ipam/ip-addresses/{ip_address.id}/assign/",
            {},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "asset_id is required" in response.data["error"]

    def test_release_ip_endpoint_success(self, authenticated_api_client, subnet, asset):
        """Test POST /api/v1/ipam/ip-addresses/{id}/release/ endpoint."""
        user = authenticated_api_client.user
        ip_address = IPAddress.objects.create(
            address="192.168.1.20",
            subnet=subnet,
            status="assigned",
            assigned_to_asset=asset,
            assigned_by=user,
        )

        data = {
            "reason": "Asset decommissioned",
            "new_status": "available",
        }
        response = authenticated_api_client.post(
            f"/api/v1/ipam/ip-addresses/{ip_address.id}/release/",
            data,
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "available"
        assert response.data["assigned_to_asset"] is None

    def test_auto_assign_endpoint_success(self, authenticated_api_client, subnet, asset):
        """Test POST /api/v1/ipam/subnets/{id}/auto-assign/ endpoint."""
        data = {
            "asset_id": asset.id,
            "reason": "Auto assignment test",
        }
        response = authenticated_api_client.post(
            f"/api/v1/ipam/subnets/{subnet.id}/auto-assign/",
            data,
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["status"] == "assigned"
        assert response.data["assigned_to_asset"] == asset.id
        assert "192.168.1" in response.data["address"]

    def test_get_assignment_history(self, authenticated_api_client, subnet, asset):
        """Test GET /api/v1/ipam/ip-addresses/{id}/history/ endpoint."""
        user = authenticated_api_client.user
        ip_address = IPAddress.objects.create(
            address="192.168.1.30",
            subnet=subnet,
            status="available",
        )

        # Create some history
        from ipam.services.ip_assignment import assign_ip_to_asset, release_ip_from_asset

        assign_ip_to_asset(ip_address, asset, user, reason="Test")
        release_ip_from_asset(ip_address, user, reason="Test release")

        response = authenticated_api_client.get(
            f"/api/v1/ipam/ip-addresses/{ip_address.id}/history/"
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 2
        assert response.data[0]["action"] == "released"
        assert response.data[1]["action"] == "assigned"
