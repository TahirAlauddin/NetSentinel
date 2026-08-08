from __future__ import annotations

from django.contrib import admin, messages
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404, render
from django.urls import path, reverse
from django.utils import timezone
from django.utils.html import format_html

from .models import AgentStep, Incident, RemediationAction, RemediationScriptPolicy, ZabbixHostLink
from .services.agent_loop import ApprovalError, InterventionError, approve_and_execute
from .services.agent_loop import intervene as intervene_incident


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
    readonly_fields = (
        "step_number",
        "role",
        "tool_name",
        "tool_input",
        "tool_output",
        "created_at",
    )
    can_delete = False


def _approve_button(obj: RemediationAction) -> str:
    """Shared by the standalone RemediationActionAdmin list and the inline under
    IncidentAdmin — a link to the GET confirmation page, never a direct-mutating
    link (the actual approval only ever happens via that page's POST)."""
    if obj.status != "awaiting_approval":
        return "—"
    url = reverse("admin:remediation_remediationaction_approve", args=[obj.pk])
    return format_html('<a class="button" href="{}">Approve…</a>', url)


class RemediationActionInline(admin.TabularInline):
    model = RemediationAction
    extra = 0
    fields = (
        "zabbix_script_name",
        "confidence",
        "status",
        "dry_run",
        "script_source",
        "generated_script_command",
        "guardrail_violations",
        "created_at",
        "approve_button",
    )
    readonly_fields = fields
    can_delete = False

    @admin.display(description="Approve")
    def approve_button(self, obj):
        return _approve_button(obj)


@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = (
        "host_name",
        "trigger_name",
        "severity",
        "status",
        "confidence",
        "human_intervened_at",
        "resolved_asset",
        "resolved_device",
        "created_at",
    )
    list_filter = ("status", "severity", "confidence")
    search_fields = ("host_name", "trigger_name", "zabbix_event_id")
    readonly_fields = ("human_intervened_at", "human_intervened_by", "human_intervention_note")
    inlines = [AgentStepInline, RemediationActionInline]
    actions = ["take_over"]

    @admin.action(description="Take over: stop the agent and remove from active tracking")
    def take_over(self, request, queryset):
        taken_over = 0
        for incident in queryset:
            try:
                intervene_incident(incident, request.user)
            except InterventionError as exc:
                self.message_user(request, f"{incident}: {exc.detail}", level=messages.WARNING)
            else:
                taken_over += 1
        if taken_over:
            self.message_user(
                request, f"Took over {taken_over} incident(s).", level=messages.SUCCESS
            )


@admin.register(RemediationAction)
class RemediationActionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "incident",
        "zabbix_script_name",
        "script_source",
        "confidence",
        "status",
        "created_at",
        "approve_button",
    )
    list_filter = ("status", "script_source", "confidence", "dry_run")
    search_fields = ("zabbix_script_name", "incident__host_name", "incident__trigger_name")
    readonly_fields = (
        "incident",
        "zabbix_script_name",
        "reasoning",
        "confidence",
        "script_source",
        "generated_script_command",
        "guardrail_violations",
        "dry_run",
        "approved_by",
        "execution_result",
        "created_at",
        "executed_at",
    )

    def has_add_permission(self, request):
        # Actions only ever come from the agent loop — never hand-created in admin.
        return False

    def get_urls(self):
        custom = [
            path(
                "<int:pk>/approve/",
                self.admin_site.admin_view(self.approve_view),
                name="remediation_remediationaction_approve",
            ),
        ]
        return custom + super().get_urls()

    @admin.display(description="Approve")
    def approve_button(self, obj):
        return _approve_button(obj)

    def approve_view(self, request, pk):
        """
        GET renders a confirmation page (see approve_confirmation.html) — never
        mutates anything, so a stray link click or prefetch can't accidentally
        trigger a real remediation. POST (from that page's form, CSRF-protected
        like every other admin form) is the only path that actually calls
        approve_and_execute.
        """
        remediation_action = get_object_or_404(RemediationAction, pk=pk)
        change_url = reverse("admin:remediation_remediationaction_change", args=[pk])

        if not request.user.has_perm("remediation.execute_remediationaction"):
            self.message_user(
                request,
                "You don't have permission to execute remediation actions.",
                level=messages.ERROR,
            )
            return HttpResponseRedirect(change_url)

        if request.method == "POST":
            try:
                approve_and_execute(remediation_action, request.user)
            except ApprovalError as exc:
                self.message_user(request, exc.detail, level=messages.ERROR)
            else:
                remediation_action.refresh_from_db()
                ok = remediation_action.status == "executed"
                self.message_user(
                    request,
                    f"{remediation_action.zabbix_script_name}: "
                    f"{remediation_action.get_status_display()}",
                    level=messages.SUCCESS if ok else messages.WARNING,
                )
            return HttpResponseRedirect(change_url)

        if remediation_action.status != "awaiting_approval":
            self.message_user(
                request,
                f"Action is '{remediation_action.status}', not awaiting approval.",
                level=messages.WARNING,
            )
            return HttpResponseRedirect(change_url)

        context = {
            **self.admin_site.each_context(request),
            "title": "Approve remediation action",
            "action": remediation_action,
            "opts": self.model._meta,
        }
        return render(
            request, "admin/remediation/remediationaction/approve_confirmation.html", context
        )
