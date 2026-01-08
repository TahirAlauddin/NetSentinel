from django.contrib import admin

from .models import (
    CarrierContact,
    Category,
    Circuit,
    Contact,
    Department,
    Location,
    PointOfContact,
    UtilityContact,
)


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ["name", "city", "state", "address1", "created_at", "updated_at"]
    search_fields = ["name", "alias", "city", "state", "address1", "address2", "zip"]
    list_filter = ["state", "type_building", "created_at", "updated_at"]


@admin.register(Circuit)
class CircuitAdmin(admin.ModelAdmin):
    list_display = [
        "location",
        "carrier",
        "speed",
        "circuit_id",
        "created_at",
        "updated_at",
    ]
    search_fields = [
        "location__name",
        "location__city",
        "location__address1",
        "carrier",
        "circuit_id",
    ]
    list_filter = ["carrier", "created_at", "updated_at"]
    raw_id_fields = ["location"]


@admin.register(PointOfContact)
class PointOfContactAdmin(admin.ModelAdmin):
    list_display = ["circuit", "contact_type", "name", "email", "phone", "created_at"]
    search_fields = [
        "circuit__location__name",
        "circuit__location__city",
        "name",
        "email",
    ]
    list_filter = ["contact_type", "created_at", "updated_at"]
    raw_id_fields = ["circuit"]


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ["name", "created_at", "updated_at"]
    search_fields = ["name"]
    list_filter = ["created_at", "updated_at"]


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "created_at", "updated_at"]
    search_fields = ["name"]
    list_filter = ["created_at", "updated_at"]


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = [
        "first_name",
        "last_name",
        "job_title",
        "business_phone",
        "city",
        "created_at",
    ]
    search_fields = [
        "first_name",
        "last_name",
        "job_title",
        "business_phone",
        "mobile_phone",
        "city",
        "state",
    ]
    list_filter = ["contact_type", "state", "country", "created_at", "updated_at"]


@admin.register(CarrierContact)
class CarrierContactAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "location",
        "customer_service_phone",
        "created_at",
    ]
    search_fields = [
        "name",
        "location__name",
        "location__city",
        "customer_service_phone",
        "technical_support_phone",
    ]
    list_filter = ["created_at", "updated_at"]
    raw_id_fields = ["location"]


@admin.register(UtilityContact)
class UtilityContactAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "location",
        "utility_type",
        "city",
        "customer_service_phone",
        "created_at",
    ]
    search_fields = [
        "name",
        "location__name",
        "location__city",
        "customer_service_phone",
        "technical_support_phone",
    ]
    list_filter = ["utility_type", "created_at", "updated_at"]
    raw_id_fields = ["location"]
