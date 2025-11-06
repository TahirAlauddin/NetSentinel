from django.contrib import admin
from .models import Location, Circuit, PointOfContact, Department, Category


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ["city", "address", "created_at", "updated_at"]
    search_fields = ["city", "address"]
    list_filter = ["created_at", "updated_at"]


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
    search_fields = ["location__city", "location__address", "carrier", "circuit_id"]
    list_filter = ["carrier", "created_at", "updated_at"]
    raw_id_fields = ["location"]


@admin.register(PointOfContact)
class PointOfContactAdmin(admin.ModelAdmin):
    list_display = ["circuit", "contact_type", "name", "email", "phone", "created_at"]
    search_fields = ["circuit__location__city", "name", "email"]
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
