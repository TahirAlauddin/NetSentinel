from django.conf import settings
from django.db import models


class ZabbixHostLink(models.Model):
    """
    Cached correlation between a Zabbix host and a NetSentinel asset/device.

    monitoring/ deliberately keeps no local DB for Zabbix hosts/items/problems
    (everything is pulled live). This is a scoped exception: the agent needs a fast,
    reliable join from "Zabbix host" to "NetSentinel asset/device" on every incident,
    and doing IP/hostname fuzzy matching live per-incident is slow and non-reproducible.
    Populated by the sync_zabbix_host_links management command, not by the agent loop.
    """

    MATCH_SOURCE_CHOICES = [
        ("auto", "Auto-matched"),
        ("manual", "Manually confirmed"),
    ]

    zabbix_host_id = models.CharField(max_length=64, unique=True)
    zabbix_hostname = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    resolved_asset = models.ForeignKey(
        "assets.Asset",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="zabbix_host_links",
    )
    resolved_device = models.ForeignKey(
        "ipam.Device",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="zabbix_host_links",
    )
    match_source = models.CharField(max_length=10, choices=MATCH_SOURCE_CHOICES, default="auto")
    matched_at = models.DateTimeField(blank=True, null=True)
    last_synced_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Zabbix Host Link"
        verbose_name_plural = "Zabbix Host Links"
        ordering = ["zabbix_hostname"]

    def __str__(self):
        return f"{self.zabbix_hostname} ({self.zabbix_host_id})"


class RemediationScriptPolicy(models.Model):
    """
    Data-driven risk registry for Zabbix remediation scripts. Ops manage this via
    Django admin so the auto-remediation allowlist can change without a redeploy.
    """

    RISK_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]

    zabbix_script_name = models.CharField(max_length=255, unique=True)
    risk_level = models.CharField(max_length=10, choices=RISK_CHOICES, default="medium")
    auto_execute_allowed = models.BooleanField(
        default=False,
        help_text="Auto-execution also requires the agent to report high confidence.",
    )
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Remediation Script Policy"
        verbose_name_plural = "Remediation Script Policies"
        ordering = ["zabbix_script_name"]

    def __str__(self):
        return self.zabbix_script_name


class Incident(models.Model):
    """One row per Zabbix problem the agent has investigated."""

    STATUS_CHOICES = [
        ("investigating", "Investigating"),
        ("remediated", "Remediated"),
        ("escalated", "Escalated"),
        ("resolved", "Resolved"),
        ("dismissed", "Dismissed"),
    ]
    CONFIDENCE_CHOICES = [
        ("high", "High"),
        ("medium", "Medium"),
        ("low", "Low"),
    ]

    # Statuses that mean "nothing left for the agent to do here" — run_incident_agent's
    # poller leaves incidents in these states alone (no retry, no re-dispatch), and
    # run_agent_loop's human-takeover check gates on them too.
    TERMINAL_STATUSES = {"remediated", "resolved", "dismissed"}

    zabbix_event_id = models.CharField(max_length=64, unique=True)
    zabbix_host_id = models.CharField(max_length=64)
    host_name = models.CharField(max_length=255)
    trigger_name = models.CharField(max_length=500)
    severity = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="investigating")
    confidence = models.CharField(
        max_length=10, choices=CONFIDENCE_CHOICES, blank=True, null=True
    )
    resolved_asset = models.ForeignKey(
        "assets.Asset",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="incidents",
    )
    resolved_device = models.ForeignKey(
        "ipam.Device",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="incidents",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(blank=True, null=True)

    human_intervened_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Set when a human takes over — halts the agent loop (checked "
        "cooperatively between ReAct turns) and stops run_incident_agent's poller "
        "from ever retrying this incident again.",
    )
    human_intervened_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="intervened_incidents",
    )
    human_intervention_note = models.TextField(blank=True)

    class Meta:
        verbose_name = "Incident"
        verbose_name_plural = "Incidents"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["zabbix_host_id"]),
        ]

    def __str__(self):
        return f"[{self.status}] {self.host_name}: {self.trigger_name}"


class AgentStep(models.Model):
    """One ReAct turn (thought / tool call / tool result / final decision), for audit."""

    ROLE_CHOICES = [
        ("thinking", "Thinking"),
        ("tool_call", "Tool Call"),
        ("tool_result", "Tool Result"),
        ("final", "Final Decision"),
    ]

    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, related_name="steps")
    step_number = models.PositiveIntegerField()
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    tool_name = models.CharField(max_length=100, blank=True, null=True)
    tool_input = models.JSONField(blank=True, null=True)
    tool_output = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Agent Step"
        verbose_name_plural = "Agent Steps"
        ordering = ["incident", "step_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["incident", "step_number"], name="remediation_agentstep_unique_step"
            )
        ]

    def __str__(self):
        return f"{self.incident_id} step {self.step_number} ({self.role})"


class RemediationAction(models.Model):
    """The remediation the agent proposed, and whether/how it was executed."""

    STATUS_CHOICES = [
        ("proposed", "Proposed"),
        ("awaiting_approval", "Awaiting Approval"),
        ("executed", "Executed"),
        ("failed", "Failed"),
        ("skipped", "Skipped"),
    ]
    CONFIDENCE_CHOICES = Incident.CONFIDENCE_CHOICES

    SCRIPT_SOURCE_CHOICES = [
        ("registered", "Registered in Zabbix"),
        ("generated", "Authored by the agent"),
    ]

    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, related_name="actions")
    zabbix_script_name = models.CharField(max_length=255, blank=True, null=True)
    reasoning = models.TextField(blank=True)
    confidence = models.CharField(max_length=10, choices=CONFIDENCE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="proposed")
    dry_run = models.BooleanField(default=False)
    script_source = models.CharField(
        max_length=10,
        choices=SCRIPT_SOURCE_CHOICES,
        default="registered",
        help_text="Whether this ran a pre-registered Zabbix script or one the agent wrote itself.",
    )
    generated_script_command = models.TextField(
        blank=True,
        help_text="Command text the agent authored, when no registered script fit. Empty for "
        "script_source='registered'.",
    )
    guardrail_violations = models.JSONField(
        blank=True,
        null=True,
        help_text="Static guardrail findings against generated_script_command. Empty/null means "
        "it passed the scan — approval is still required regardless.",
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_remediation_actions",
        help_text="Null means the action was executed autonomously by the agent.",
    )
    execution_result = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    executed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        verbose_name = "Remediation Action"
        verbose_name_plural = "Remediation Actions"
        ordering = ["-created_at"]
        permissions = [
            ("execute_remediationaction", "Can execute a proposed remediation action"),
        ]

    def __str__(self):
        return f"{self.incident_id}: {self.zabbix_script_name or '(no script)'} [{self.status}]"
