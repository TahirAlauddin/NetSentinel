"""
Serializers for the contracts app.

Exposes Contract as JSON via DRF ModelSerializer with read-only
id, created_at, updated_at and validation for monetary/date fields.
Document uploads are optional; extension and size are validated by the model validators.
"""

from decimal import Decimal

from rest_framework import serializers

from .expiry import get_contract_expiry_status
from .models import Contract

CONTRACT_TYPE_DISPLAY = {"fixed_term": "Fixed Term", "monthly": "Monthly"}


def _contract_total_cost(start_date, end_date, mrc: Decimal) -> float | None:
    """Total cost = MRC x months between start and end. None for monthly (no end)."""
    if not start_date or not end_date:
        return None
    days = (end_date - start_date).days
    months = max(1, round(days / 30.4375, 2))
    return round(float(mrc) * months, 2)


class ContractSerializer(serializers.ModelSerializer):
    """
    Serializer for Contract.

    Exposes all Contract fields for list/detail and create/update.
    expiry_label, category_name, contract_type, total_cost are computed server-side.
    """

    expiry_label = serializers.SerializerMethodField()
    expiry_status = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()
    contract_type_display = serializers.SerializerMethodField()
    total_cost = serializers.SerializerMethodField()

    class Meta:
        model = Contract
        fields = [
            "id",
            "carrier",
            "contract_number",
            "contract_type",
            "contract_type_display",
            "date",
            "nrc",
            "mrc",
            "start_date",
            "end_date",
            "document",
            "logo",
            "category",
            "category_name",
            "total_cost",
            "created_at",
            "updated_at",
            "expiry_label",
            "expiry_status",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "expiry_label",
            "expiry_status",
            "category_name",
            "contract_type_display",
            "total_cost",
        ]

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

    def get_category_name(self, obj: Contract) -> str:
        cat = getattr(obj, "category", None)
        return cat.name if cat else "—"

    def get_contract_type_display(self, obj: Contract) -> str:
        ct = getattr(obj, "contract_type", None) or "fixed_term"
        return CONTRACT_TYPE_DISPLAY.get(ct, "Fixed Term")

    def get_total_cost(self, obj: Contract) -> float | None:
        if getattr(obj, "contract_type", None) == "monthly":
            return None
        return _contract_total_cost(
            getattr(obj, "start_date", None),
            getattr(obj, "end_date", None),
            getattr(obj, "mrc", Decimal("0")) or Decimal("0"),
        )

    def validate(self, attrs):
        ct = attrs.get("contract_type")
        end = attrs.get("end_date")
        if self.instance:
            ct = ct if ct is not None else self.instance.contract_type
            end = end if "end_date" in attrs else self.instance.end_date
        if ct == "fixed_term" and not end:
            raise serializers.ValidationError(
                {"end_date": "End date is required for Fixed Term contracts."}
            )
        return attrs
