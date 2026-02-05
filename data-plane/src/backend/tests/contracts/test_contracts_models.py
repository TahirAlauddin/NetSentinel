"""
Tests for Contract model.
"""

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from contracts.models import Contract


def _contract_kwargs(**overrides):
    """Minimal valid kwargs for Contract creation."""
    from datetime import date

    data = {
        "carrier": "Test Carrier",
        "contract_number": "CN-001",
        "start_date": date(2024, 1, 1),
    }
    data.update(overrides)
    return data


@pytest.mark.django_db
class TestContractModel:
    """Test cases for Contract model."""

    def test_contract_creation_minimal(self):
        """Test that a contract can be created with required fields only."""
        contract = Contract.objects.create(**_contract_kwargs())
        assert contract.carrier == "Test Carrier"
        assert contract.contract_number == "CN-001"
        assert contract.start_date.year == 2024
        assert contract.date is None
        assert contract.end_date is None
        assert contract.nrc == 0
        assert contract.mrc == 0

    def test_contract_creation_full(self):
        """Test that a contract can be created with all fields."""
        from datetime import date

        contract = Contract.objects.create(
            **_contract_kwargs(
                date=date(2023, 12, 15),
                nrc=500.00,
                mrc=100.50,
                end_date=date(2025, 12, 31),
            )
        )
        assert contract.date == date(2023, 12, 15)
        assert contract.nrc == 500.00
        assert contract.mrc == 100.50
        assert contract.end_date == date(2025, 12, 31)

    def test_contract_str_representation(self):
        """Test contract string representation."""
        contract = Contract.objects.create(**_contract_kwargs())
        assert "Test Carrier" in str(contract)
        assert "CN-001" in str(contract)

    def test_contract_ordering(self):
        """Test that contracts are ordered by carrier then contract_number."""
        from datetime import date

        Contract.objects.create(**_contract_kwargs(carrier="Carrier B", contract_number="CN-002"))
        Contract.objects.create(**_contract_kwargs(carrier="Carrier A", contract_number="CN-002"))
        Contract.objects.create(**_contract_kwargs(carrier="Carrier A", contract_number="CN-001"))

        contracts = list(Contract.objects.all())
        assert contracts[0].carrier == "Carrier A" and contracts[0].contract_number == "CN-001"
        assert contracts[1].carrier == "Carrier A" and contracts[1].contract_number == "CN-002"
        assert contracts[2].carrier == "Carrier B"

    def test_contract_unique_carrier_contract_number(self):
        """Test that (carrier, contract_number) must be unique."""
        Contract.objects.create(**_contract_kwargs())
        with pytest.raises(IntegrityError):
            Contract.objects.create(**_contract_kwargs())

    def test_contract_same_number_different_carrier_allowed(self):
        """Test that same contract_number is allowed for different carriers."""
        Contract.objects.create(**_contract_kwargs(carrier="Carrier A"))
        contract2 = Contract.objects.create(
            **_contract_kwargs(carrier="Carrier B", contract_number="CN-001")
        )
        assert contract2.carrier == "Carrier B"
        assert Contract.objects.count() == 2

    def test_contract_nrc_validation_negative(self):
        """Test that negative NRC raises ValidationError."""
        contract = Contract(**_contract_kwargs(), nrc=-10)
        with pytest.raises(ValidationError):
            contract.full_clean()

    def test_contract_mrc_validation_negative(self):
        """Test that negative MRC raises ValidationError."""
        contract = Contract(**_contract_kwargs(), mrc=-5.50)
        with pytest.raises(ValidationError):
            contract.full_clean()

    def test_contract_nrc_mrc_zero_allowed(self):
        """Test that zero NRC and MRC are valid."""
        contract = Contract.objects.create(**_contract_kwargs())
        contract.full_clean()
        assert contract.nrc == 0
        assert contract.mrc == 0
