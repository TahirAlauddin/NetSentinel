"""
Tests for IP Request (Reservation) functionality.
"""

import pytest
from django.utils import timezone
from rest_framework import status

from infrastructure.models import Location
from ipam.models import IPRequest, Subnet, SubnetGroup
from users.models import User


@pytest.mark.django_db
class TestIPRequestModel:
    """Test cases for IPRequest model."""

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
    def user(self):
        """Create a test user."""
        return User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
        )

    def test_create_ip_request(self, subnet, user):
        """Test creating an IP request."""
        request = IPRequest.objects.create(
            requested_by=user,
            subnet=subnet,
            purpose="Test purpose",
            description="Test description",
        )

        assert request.status == "pending"
        assert request.requested_by == user
        assert request.subnet == subnet
        assert request.can_be_approved() is True
        assert request.can_be_rejected() is True

    def test_ip_request_str_representation(self, subnet, user):
        """Test IP request string representation."""
        request = IPRequest.objects.create(
            requested_by=user,
            subnet=subnet,
            requested_ip="192.168.1.10",
            purpose="Test",
        )

        assert str(request) == f"{user.username} - 192.168.1.10 (Pending)"

    def test_ip_request_is_expired(self, subnet, user):
        """Test checking if reservation is expired."""
        # Create request with expired reservation
        expired_date = timezone.now() - timezone.timedelta(days=1)
        request = IPRequest.objects.create(
            requested_by=user,
            subnet=subnet,
            purpose="Test",
            status="approved",
            reservation_expires_at=expired_date,
        )

        assert request.is_expired() is True

    def test_ip_request_not_expired(self, subnet, user):
        """Test checking if reservation is not expired."""
        # Create request with future expiration
        future_date = timezone.now() + timezone.timedelta(days=1)
        request = IPRequest.objects.create(
            requested_by=user,
            subnet=subnet,
            purpose="Test",
            status="approved",
            reservation_expires_at=future_date,
        )

        assert request.is_expired() is False


@pytest.mark.api
@pytest.mark.django_db
class TestIPRequestViews:
    """Test cases for IP Request API endpoints."""

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
    def user(self):
        """Create a test user."""
        return User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
        )

    def test_create_ip_request(self, authenticated_api_client, subnet):
        """Test POST /api/v1/ipam/ip-requests/ endpoint."""
        data = {
            "subnet": subnet.id,
            "purpose": "Test IP request",
            "description": "Need IP for new server",
        }
        response = authenticated_api_client.post(
            "/api/v1/ipam/ip-requests/",
            data,
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["status"] == "pending"
        assert response.data["purpose"] == "Test IP request"

    def test_create_ip_request_with_specific_ip(self, authenticated_api_client, subnet):
        """Test creating IP request with specific IP address."""
        data = {
            "subnet": subnet.id,
            "requested_ip": "192.168.1.10",
            "purpose": "Specific IP needed",
        }
        response = authenticated_api_client.post(
            "/api/v1/ipam/ip-requests/",
            data,
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["requested_ip"] == "192.168.1.10"

    def test_create_ip_request_nested_route(self, authenticated_api_client, subnet):
        """Test creating IP request via nested route."""
        data = {
            "purpose": "Nested route test",
        }
        response = authenticated_api_client.post(
            f"/api/v1/ipam/subnets/{subnet.id}/ip-requests/",
            data,
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["subnet"] == subnet.id

    def test_list_ip_requests(self, authenticated_api_client, subnet):
        """Test GET /api/v1/ipam/ip-requests/ endpoint."""
        user = authenticated_api_client.user
        IPRequest.objects.create(
            requested_by=user,
            subnet=subnet,
            purpose="Request 1",
        )
        IPRequest.objects.create(
            requested_by=user,
            subnet=subnet,
            purpose="Request 2",
        )

        response = authenticated_api_client.get("/api/v1/ipam/ip-requests/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] >= 2

    def test_approve_ip_request(self, authenticated_api_client, subnet):
        """Test POST /api/v1/ipam/ip-requests/{id}/approve/ endpoint."""
        user = authenticated_api_client.user
        request = IPRequest.objects.create(
            requested_by=user,
            subnet=subnet,
            purpose="Test approval",
        )

        data = {"approval_notes": "Approved for testing"}
        response = authenticated_api_client.post(
            f"/api/v1/ipam/ip-requests/{request.id}/approve/",
            data,
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "completed"
        assert response.data["approved_by"] == user.id
        assert response.data["ip_address"] is not None  # IP should be created

    def test_approve_ip_request_with_specific_ip(self, authenticated_api_client, subnet):
        """Test approving IP request with specific IP."""
        user = authenticated_api_client.user
        request = IPRequest.objects.create(
            requested_by=user,
            subnet=subnet,
            requested_ip="192.168.1.50",
            purpose="Specific IP request",
        )

        response = authenticated_api_client.post(
            f"/api/v1/ipam/ip-requests/{request.id}/approve/",
            {},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        request.refresh_from_db()
        assert request.ip_address.address == "192.168.1.50"

    def test_reject_ip_request(self, authenticated_api_client, subnet):
        """Test POST /api/v1/ipam/ip-requests/{id}/reject/ endpoint."""
        user = authenticated_api_client.user
        request = IPRequest.objects.create(
            requested_by=user,
            subnet=subnet,
            purpose="Test rejection",
        )

        data = {"approval_notes": "Not approved - insufficient justification"}
        response = authenticated_api_client.post(
            f"/api/v1/ipam/ip-requests/{request.id}/reject/",
            data,
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "rejected"
        assert response.data["approved_by"] == user.id

    def test_approve_already_approved_request_fails(self, authenticated_api_client, subnet):
        """Test that approving an already approved request fails."""
        user = authenticated_api_client.user
        request = IPRequest.objects.create(
            requested_by=user,
            subnet=subnet,
            purpose="Test",
            status="completed",
        )

        response = authenticated_api_client.post(
            f"/api/v1/ipam/ip-requests/{request.id}/approve/",
            {},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "cannot be approved" in response.data["error"].lower()

    def test_filter_ip_requests_by_status(self, authenticated_api_client, subnet):
        """Test filtering IP requests by status."""
        user = authenticated_api_client.user
        IPRequest.objects.create(
            requested_by=user,
            subnet=subnet,
            purpose="Pending request",
            status="pending",
        )
        IPRequest.objects.create(
            requested_by=user,
            subnet=subnet,
            purpose="Completed request",
            status="completed",
        )

        response = authenticated_api_client.get("/api/v1/ipam/ip-requests/?status=pending")

        assert response.status_code == status.HTTP_200_OK
        assert all(req["status"] == "pending" for req in response.data["results"])

    def test_get_subnet_ip_requests(self, authenticated_api_client, subnet):
        """Test GET /api/v1/ipam/subnets/{id}/ip-requests/ endpoint."""
        user = authenticated_api_client.user
        IPRequest.objects.create(
            requested_by=user,
            subnet=subnet,
            purpose="Request 1",
        )

        # Create another subnet and request
        location = Location.objects.create(name="Location 2", city="City 2")
        group = SubnetGroup.objects.create(name="Group 2")
        subnet2 = Subnet.objects.create(
            network="10.0.0.0/24",
            group=group,
            location=location,
        )
        IPRequest.objects.create(
            requested_by=user,
            subnet=subnet2,
            purpose="Request 2",
        )

        response = authenticated_api_client.get(f"/api/v1/ipam/subnets/{subnet.id}/ip-requests/")

        assert response.status_code == status.HTTP_200_OK
        # Should only return requests for subnet, not subnet2
        assert all(req["subnet"] == subnet.id for req in response.data["results"])
