from django.contrib import admin
from .models import TenantProvisioning


@admin.register(TenantProvisioning)
class TenantProvisioningAdmin(admin.ModelAdmin):
    list_display = [
        "company",
        "namespace_name",
        "status",
        "created_at",
        "updated_at",
        "completed_at",
    ]
    list_filter = ["status", "created_at"]
    search_fields = ["company__name", "namespace_name"]
    readonly_fields = ["id", "created_at", "updated_at", "completed_at"]
    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "id",
                    "company",
                    "namespace_name",
                    "status",
                )
            },
        ),
        (
            "Details",
            {
                "fields": (
                    "error_message",
                    "logs",
                )
            },
        ),
        (
            "Timestamps",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                    "completed_at",
                )
            },
        ),
    )
