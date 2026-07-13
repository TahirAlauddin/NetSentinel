from django.contrib import admin
from django.utils import timezone

from .models import AgentStep, Incident, RemediationAction, RemediationScriptPolicy, ZabbixHostLink


@admin.register(RemediationScriptPolicy)
class RemediationScriptPolicyAdmin(admin.ModelAdmin):
    list_display = ("zabbix_script_name", "risk_level", "auto_execute_allowed", "updated_at")
    list_filter = ("risk_level", "auto_execute_allowed")
    search_fields = ("zabbix_script_name", "description")


@admin.register(ZabbixHostLink)
class ZabbixHostLinkAdmin(admin.ModelAdmin):
    list_display = (
        "zabbix_hostname",
        "zabbix_host_id",
        "ip_address",
        "resolved_asset",
        "resolved_device",
        "match_source",
        "last_synced_at",
    )
    list_filter = ("match_source",)
    search_fields = ("zabbix_hostname", "zabbix_host_id", "ip_address")
    actions = ["mark_manual"]

    @admin.action(description="Mark selected links as manually confirmed (protects from sync)")
    def mark_manual(self, request, queryset):
        queryset.update(match_source="manual", matched_at=timezone.now())


class AgentStepInline(admin.TabularInline):
    model = AgentStep
    extra = 0
    readonly_fields = ("step_number", "role", "tool_name", "tool_input", "tool_output", "created_at")
    can_delete = False


class RemediationActionInline(admin.TabularInline):
    model = RemediationAction
    extra = 0
    readonly_fields = ("zabbix_script_name", "confidence", "status", "dry_run", "created_at")
    can_delete = False


@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = (
        "host_name",
        "trigger_name",
        "severity",
        "status",
        "confidence",
        "resolved_asset",
        "resolved_device",
        "created_at",
    )
    list_filter = ("status", "severity", "confidence")
    search_fields = ("host_name", "trigger_name", "zabbix_event_id")
    inlines = [AgentStepInline, RemediationActionInline]
