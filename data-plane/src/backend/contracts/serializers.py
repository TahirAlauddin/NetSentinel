"""
Serializers for the contracts app.

Exposes Contract as JSON via DRF ModelSerializer with read-only
id, created_at, updated_at and validation for monetary/date fields.
Document uploads are optional; extension and size are validated by the model validators.
"""

from rest_framework import serializers

from .expiry import get_contract_expiry_status
from .models import Contract


class ContractSerializer(serializers.ModelSerializer):
    """
    Serializer for Contract.

    Exposes all Contract fields for list/detail and create/update.
    expiry_label is computed server-side (single source of truth); no client date logic.
    """

    expiry_label = serializers.SerializerMethodField()
    expiry_status = serializers.SerializerMethodField()

    class Meta:
        model = Contract
        fields = [
            "id",
            "carrier",
            "contract_number",
            "date",
            "nrc",
            "mrc",
            "start_date",
            "end_date",
            "document",
            "logo",
            "category",
            "created_at",
            "updated_at",
            "expiry_label",
            "expiry_status",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "expiry_label", "expiry_status"]

    def get_expiry_label(self, obj: Contract) -> str | None:
        end_date = getattr(obj, "end_date", None)
        if end_date is None:
            return None
        status = get_contract_expiry_status(end_date)
        return status["label"] if status else None

    def get_expiry_status(self, obj: Contract) -> str | None:
        end_date = getattr(obj, "end_date", None)
        if end_date is None:
            return None
        status = get_contract_expiry_status(end_date)
        return status["status"] if status else None
