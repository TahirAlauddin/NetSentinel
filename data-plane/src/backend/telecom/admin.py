from django.contrib import admin

from .models import DataCircuit, PhoneNumber, Provider, Service


@admin.register(Provider)
class ProviderAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "service_type",
        "status",
        "account_number",
        "monthly_cost",
        "created_at",
    ]
    search_fields = [
        "name",
        "description",
        "account_number",
        "contact_name",
        "contact_email",
        "contact_phone",
    ]
    list_filter = [
        "service_type",
        "status",
        "created_at",
        "updated_at",
    ]


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "provider",
        "location",
        "service_category",
        "service_type",
        "monthly_cost",
        "created_at",
    ]
    search_fields = [
        "name",
        "provider__name",
        "location__name",
        "account_number",
        "contract_id",
    ]
    list_filter = [
        "service_category",
        "service_type",
        "created_at",
        "updated_at",
    ]
    raw_id_fields = ["provider", "location"]


@admin.register(DataCircuit)
class DataCircuitAdmin(admin.ModelAdmin):
    list_display = [
        "circuit_id",
        "alternate_cid",
        "provider",
        "carrier",
        "location",
        "circuit_type",
        "line_speed",
        "monthly_cost",
        "created_at",
    ]
    search_fields = [
        "circuit_id",
        "alternate_cid",
        "carrier",
        "provider__name",
        "location__name",
        "location__city",
        "account_number",
        "quote_id",
        "contract_id",
    ]
    list_filter = [
        "circuit_type",
        "line_speed",
        "handoff_type",
        "fiber_type",
        "connector_type",
        "provider",
        "created_at",
        "updated_at",
    ]
    raw_id_fields = ["provider", "location", "service"]


@admin.register(PhoneNumber)
class PhoneNumberAdmin(admin.ModelAdmin):
    list_display = [
        "number",
        "friendly_name",
        "provider",
        "service",
        "location",
        "created_at",
    ]
    search_fields = [
        "number",
        "friendly_name",
        "provider__name",
        "notes",
    ]
    list_filter = ["provider", "created_at", "updated_at"]
    raw_id_fields = ["provider", "service", "location"]  # service is FK to Service
