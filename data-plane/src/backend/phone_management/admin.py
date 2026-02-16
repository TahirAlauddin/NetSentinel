from django.contrib import admin

from .models import ManagedPhoneNumber, ManagedPhoneNumberBlock


@admin.register(ManagedPhoneNumber)
class ManagedPhoneNumberAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "number",
        "location",
        "assigned_user",
        "extension_number",
        "service_type",
        "did_enabled",
    ]
    search_fields = ["name", "number", "extension_number", "assigned_user__email"]
    list_filter = ["service_type", "did_enabled", "location"]
    raw_id_fields = ["location", "assigned_user"]


@admin.register(ManagedPhoneNumberBlock)
class ManagedPhoneNumberBlockAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "location",
        "start_number",
        "end_number",
        "is_static_assignment",
    ]
    search_fields = ["name", "start_number", "end_number"]
    list_filter = ["location", "is_static_assignment"]
    raw_id_fields = ["location"]
