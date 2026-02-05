from django.contrib import admin

from .models import Contract


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    """Admin for Contract: list display, filters, search."""

    list_display = (
        "carrier",
        "contract_number",
        "start_date",
        "end_date",
        "nrc",
        "mrc",
        "document",
    )
    list_filter = ("carrier",)
    search_fields = ("carrier", "contract_number")
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "start_date"
