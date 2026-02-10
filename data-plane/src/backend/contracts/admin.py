from django.contrib import admin

from .models import Contract, ContractCategory


@admin.register(ContractCategory)
class ContractCategoryAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    """Admin for Contract: list display, filters, search."""

    list_display = (
        "carrier",
        "contract_number",
        "category",
        "start_date",
        "end_date",
        "nrc",
        "mrc",
        "document",
    )
    list_filter = ("carrier", "category")
    search_fields = ("carrier", "contract_number")
    readonly_fields = ("created_at", "updated_at")
    date_hierarchy = "start_date"
