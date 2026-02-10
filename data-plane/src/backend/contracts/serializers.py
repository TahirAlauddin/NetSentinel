"""
Serializers for the contracts app.

Exposes Contract as JSON via DRF ModelSerializer with read-only
id, created_at, updated_at and validation for monetary/date fields.
Document uploads are optional; extension and size are validated by the model validators.
"""

from rest_framework import serializers

from .models import Contract


class ContractSerializer(serializers.ModelSerializer):
    """
    Serializer for Contract.

    Exposes all Contract fields for list/detail and create/update.
    NRC and MRC are validated as non-negative via the model validators.
    """

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
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
