"""
Tests for Contract API views.
"""

from datetime import date

import pytest
from rest_framework import status

from contracts.models import Contract


@pytest.mark.api
@pytest.mark.django_db
class TestContractViewSet:
    """Test cases for ContractViewSet."""

    def test_list_contracts_requires_authentication(self, api_client):
        """Test that listing contracts requires authentication."""
        response = api_client.get("/api/v1/contracts/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_contracts_success(self, authenticated_api_client):
        """Test that authenticated user can list contracts."""
        Contract.objects.create(
            carrier="Carrier A",
            contract_number="CN-001",
            start_date=date(2024, 1, 1),
        )
        Contract.objects.create(
            carrier="Carrier B",
            contract_number="CN-002",
            start_date=date(2024, 6, 1),
        )
        response = authenticated_api_client.get("/api/v1/contracts/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 2

    def test_create_contract_success(self, authenticated_api_client):
        """Test that authenticated user can create a contract."""
        data = {
            "carrier": "New Carrier",
            "contract_number": "NEW-001",
            "start_date": "2024-01-01",
            "date": "2023-12-15",
            "nrc": "100.00",
            "mrc": "50.00",
            "end_date": "2025-12-31",
        }
        response = authenticated_api_client.post(
            "/api/v1/contracts/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["carrier"] == "New Carrier"
        assert response.data["contract_number"] == "NEW-001"
        assert response.data["nrc"] == "100.00"
        assert response.data["mrc"] == "50.00"

    def test_retrieve_contract_success(self, authenticated_api_client):
        """Test that authenticated user can retrieve a contract."""
        contract = Contract.objects.create(
            carrier="Test Carrier",
            contract_number="CN-001",
            start_date=date(2024, 1, 1),
        )
        response = authenticated_api_client.get(f"/api/v1/contracts/{contract.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["carrier"] == "Test Carrier"
        assert response.data["contract_number"] == "CN-001"

    def test_update_contract_success(self, authenticated_api_client):
        """Test that authenticated user can update a contract."""
        contract = Contract.objects.create(
            carrier="Old Carrier",
            contract_number="OLD-001",
            start_date=date(2024, 1, 1),
        )
        data = {
            "carrier": "Updated Carrier",
            "contract_number": "UPD-001",
            "start_date": "2024-01-01",
            "nrc": "0",
            "mrc": "0",
        }
        response = authenticated_api_client.put(
            f"/api/v1/contracts/{contract.id}/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["carrier"] == "Updated Carrier"
        assert response.data["contract_number"] == "UPD-001"

    def test_partial_update_contract_success(self, authenticated_api_client):
        """Test that authenticated user can partially update a contract."""
        contract = Contract.objects.create(
            carrier="Carrier",
            contract_number="CN-001",
            start_date=date(2024, 1, 1),
            mrc=25.00,
        )
        response = authenticated_api_client.patch(
            f"/api/v1/contracts/{contract.id}/",
            {"mrc": "99.99"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["mrc"] == "99.99"
        assert response.data["carrier"] == "Carrier"

    def test_delete_contract_success(self, authenticated_api_client):
        """Test that authenticated user can delete a contract."""
        contract = Contract.objects.create(
            carrier="To Delete",
            contract_number="DEL-001",
            start_date=date(2024, 1, 1),
        )
        response = authenticated_api_client.delete(f"/api/v1/contracts/{contract.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Contract.objects.filter(id=contract.id).exists()

    def test_retrieve_contract_404(self, authenticated_api_client):
        """Test that retrieve returns 404 for non-existent contract."""
        response = authenticated_api_client.get("/api/v1/contracts/99999/")
        assert response.status_code == status.HTTP_404_NOT_FOUND
