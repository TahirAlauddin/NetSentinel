from rest_framework import serializers

from .models import AgentStep, Incident, RemediationAction, RemediationScriptPolicy


class AgentStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentStep
        fields = [
            "id",
            "step_number",
            "role",
            "tool_name",
            "tool_input",
            "tool_output",
            "created_at",
        ]


class RemediationActionSerializer(serializers.ModelSerializer):
    approved_by_username = serializers.CharField(source="approved_by.username", read_only=True)

    class Meta:
        model = RemediationAction
        fields = [
            "id",
            "incident",
            "zabbix_script_name",
            "reasoning",
            "confidence",
            "status",
            "dry_run",
            "script_source",
            "generated_script_command",
            "guardrail_violations",
            "approved_by",
            "approved_by_username",
            "execution_result",
            "created_at",
            "executed_at",
        ]


class IncidentListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Incident
        fields = [
            "id",
            "zabbix_event_id",
            "host_name",
            "trigger_name",
            "severity",
            "status",
            "confidence",
            "resolved_asset",
            "resolved_device",
            "created_at",
            "resolved_at",
            "human_intervened_at",
        ]


class IncidentDetailSerializer(serializers.ModelSerializer):
    steps = AgentStepSerializer(many=True, read_only=True)
    actions = RemediationActionSerializer(many=True, read_only=True)
    human_intervened_by_username = serializers.CharField(
        source="human_intervened_by.username", read_only=True
    )

    class Meta:
        model = Incident
        fields = [
            "id",
            "zabbix_event_id",
            "zabbix_host_id",
            "host_name",
            "trigger_name",
            "severity",
            "status",
            "confidence",
            "resolved_asset",
            "resolved_device",
            "created_at",
            "updated_at",
            "resolved_at",
            "human_intervened_at",
            "human_intervened_by",
            "human_intervened_by_username",
            "human_intervention_note",
            "steps",
            "actions",
        ]


class RemediationScriptPolicySerializer(serializers.ModelSerializer):
    class Meta:
        model = RemediationScriptPolicy
        fields = [
            "id",
            "zabbix_script_name",
            "risk_level",
            "auto_execute_allowed",
            "description",
            "created_at",
            "updated_at",
        ]
