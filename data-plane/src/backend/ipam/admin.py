from django.contrib import admin

from .models import (
    VLAN,
    VRF,
    Customer,
    DNSRecord,
    DNSZone,
    IPAddress,
    IPRequest,
    Subnet,
    SubnetGroup,
)


@admin.register(SubnetGroup)
class SubnetGroupAdmin(admin.ModelAdmin):
    list_display = ["name", "description", "created_at", "updated_at"]
    search_fields = ["name", "description"]
    list_filter = ["created_at", "updated_at"]


@admin.register(VLAN)
class VLANAdmin(admin.ModelAdmin):
    list_display = ["vlan_id", "name", "location", "description", "created_at", "updated_at"]
    search_fields = ["vlan_id", "name", "description", "location__name", "location__city"]
    list_filter = ["location", "created_at", "updated_at"]
    raw_id_fields = ["location"]


@admin.register(VRF)
class VRFAdmin(admin.ModelAdmin):
    list_display = ["name", "rd", "location", "description", "created_at", "updated_at"]
    search_fields = ["name", "rd", "description", "location__name", "location__city"]
    list_filter = ["location", "created_at", "updated_at"]
    raw_id_fields = ["location"]


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ["name", "contact_email", "contact_phone", "created_at", "updated_at"]
    search_fields = ["name", "description", "contact_email", "contact_phone"]
    list_filter = ["created_at", "updated_at"]


@admin.register(Subnet)
class SubnetAdmin(admin.ModelAdmin):
    list_display = [
        "network",
        "group",
        "location",
        "vlan",
        "vrf",
        "gateway_ip",
        "master_subnet",
        "customer",
        "is_ipv6",
        "status",
        "created_at",
        "updated_at",
    ]
    search_fields = [
        "network",
        "description",
        "group__name",
        "location__name",
        "location__city",
        "gateway_ip",
        "nameservers",
        "customer__name",
    ]
    list_filter = [
        "group",
        "location",
        "vlan",
        "vrf",
        "master_subnet",
        "customer",
        "is_ipv6",
        "status",
        "created_at",
        "updated_at",
    ]
    raw_id_fields = ["group", "location", "vlan", "vrf", "master_subnet", "customer"]


@admin.register(DNSZone)
class DNSZoneAdmin(admin.ModelAdmin):
    list_display = ["name", "location", "description", "created_at", "updated_at"]
    search_fields = ["name", "description", "location__name", "location__city"]
    list_filter = ["location", "created_at", "updated_at"]
    raw_id_fields = ["location"]


@admin.register(DNSRecord)
class DNSRecordAdmin(admin.ModelAdmin):
    list_display = ["name", "zone", "record_type", "value", "ttl", "created_at", "updated_at"]
    search_fields = ["name", "value", "zone__name", "description"]
    list_filter = ["zone", "record_type", "created_at", "updated_at"]
    raw_id_fields = ["zone"]


@admin.register(IPAddress)
class IPAddressAdmin(admin.ModelAdmin):
    list_display = ["address", "subnet", "status", "description", "created_at", "updated_at"]
    search_fields = ["address", "description", "subnet__network"]
    list_filter = ["subnet", "status", "created_at", "updated_at"]
    raw_id_fields = ["subnet"]


@admin.register(IPRequest)
class IPRequestAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "requested_by",
        "subnet",
        "requested_ip",
        "status",
        "purpose",
        "approved_by",
        "approved_at",
        "created_at",
    ]
    search_fields = [
        "requested_ip",
        "purpose",
        "description",
        "requested_by__username",
        "requested_by__email",
        "subnet__network",
        "approval_notes",
    ]
    list_filter = ["status", "subnet", "created_at", "approved_at"]
    raw_id_fields = ["requested_by", "approved_by", "subnet", "ip_address"]
    readonly_fields = ["created_at", "updated_at", "approved_at"]
    date_hierarchy = "created_at"
