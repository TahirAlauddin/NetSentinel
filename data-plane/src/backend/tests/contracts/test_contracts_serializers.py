"""
Tests for Contract serializer.
"""

from datetime import date
from decimal import Decimal

import pytest

from contracts.models import Contract
from contracts.serializers import ContractSerializer


def _contract_payload(**overrides):
    """Minimal valid payload for ContractSerializer."""
    data = {
        "carrier": "Test Carrier",
        "contract_number": "CN-001",
        "start_date": "2024-01-01",
    }
    data.update(overrides)
    return data


@pytest.mark.django_db
class TestContractSerializer:
    """Test cases for ContractSerializer."""

    def test_contract_serializer_serialization(self):
        """Test that ContractSerializer correctly serializes a contract."""
        contract = Contract.objects.create(
            carrier="Carrier X",
            contract_number="X-001",
            start_date=date(2024, 6, 1),
            date=date(2024, 5, 15),
            nrc=100.00,
            mrc=50.25,
            end_date=date(2026, 5, 31),
        )
        serializer = ContractSerializer(contract)
        data = serializer.data

        assert data["id"] == contract.id
        assert data["carrier"] == "Carrier X"
        assert data["contract_number"] == "X-001"
        assert data["start_date"] == "2024-06-01"
        assert data["date"] == "2024-05-15"
        assert data["end_date"] == "2026-05-31"
        assert data["nrc"] == "100.00"
        assert data["mrc"] == "50.25"
        assert "created_at" in data
        assert "updated_at" in data

    def test_contract_serializer_create(self):
        """Test creating a contract via serializer."""
        payload = _contract_payload(
            date="2024-01-15",
            nrc=200.00,
            mrc=75.50,
            end_date="2025-12-31",
        )
        serializer = ContractSerializer(data=payload)
        assert serializer.is_valid(), serializer.errors
        contract = serializer.save()
        assert contract.carrier == "Test Carrier"
        assert contract.contract_number == "CN-001"
        assert contract.nrc == 200.00
        assert contract.mrc == 75.50
        assert contract.date == date(2024, 1, 15)
        assert contract.end_date == date(2025, 12, 31)

    def test_contract_serializer_create_minimal(self):
        """Test creating a contract with minimal fields (no date, end_date)."""
        payload = _contract_payload()
        serializer = ContractSerializer(data=payload)
        assert serializer.is_valid(), serializer.errors
        contract = serializer.save()
        assert contract.date is None
        assert contract.end_date is None
        assert contract.nrc == 0
        assert contract.mrc == 0

    def test_contract_serializer_update(self):
        """Test updating a contract via serializer."""
        contract = Contract.objects.create(
            carrier="Old Carrier",
            contract_number="OLD-001",
            start_date=date(2024, 1, 1),
            mrc=10.00,
            end_date=date(2025, 12, 31),
        )
        payload = {
            "carrier": "New Carrier",
            "contract_number": "NEW-001",
            "start_date": "2024-01-01",
            "end_date": "2025-12-31",
            "mrc": "25.00",
        }
        serializer = ContractSerializer(contract, data=payload, partial=False)
        assert serializer.is_valid(), serializer.errors
        updated = serializer.save()
        assert updated.carrier == "New Carrier"
        assert updated.contract_number == "NEW-001"
        assert updated.mrc == 25.00

    def test_contract_serializer_partial_update(self):
        """Test partial update leaves other fields unchanged."""
        contract = Contract.objects.create(
            carrier="Carrier",
            contract_number="CN-001",
            start_date=date(2024, 1, 1),
            mrc=50.00,
            end_date=date(2025, 12, 31),
        )
        serializer = ContractSerializer(contract, data={"mrc": "99.99"}, partial=True)
        assert serializer.is_valid(), serializer.errors
        updated = serializer.save()
        assert updated.mrc == Decimal("99.99")
        assert updated.carrier == "Carrier"
        assert updated.contract_number == "CN-001"

    def test_contract_serializer_invalid_negative_nrc(self):
        """Test that negative NRC is invalid."""
        payload = _contract_payload(nrc=-1)
        serializer = ContractSerializer(data=payload)
        assert not serializer.is_valid()
        assert "nrc" in serializer.errors

    def test_contract_serializer_invalid_negative_mrc(self):
        """Test that negative MRC is invalid."""
        payload = _contract_payload(mrc=-1)
        serializer = ContractSerializer(data=payload)
        assert not serializer.is_valid()
        assert "mrc" in serializer.errors

    def test_contract_serializer_missing_required_fields(self):
        """Test that missing required fields fail validation."""
        serializer = ContractSerializer(data={})
        assert not serializer.is_valid()
        assert "carrier" in serializer.errors
        assert "contract_number" in serializer.errors
        assert "start_date" in serializer.errors
