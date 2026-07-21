"""
Tests for run_agent_loop's cooperative human-takeover check: a human hitting
"intervene" (see test_remediation_views.py's TestIncidentIntervene) sets
Incident.human_intervened_at, and the agent loop is expected to notice and stop
rather than keep investigating or execute/propose a remediation on top of a
human who already took ownership.
"""

import json
from types import SimpleNamespace

import pytest
from django.utils import timezone

from remediation.models import AgentStep, Incident, RemediationAction
from remediation.services import agent_loop


def _completion(tool_calls=(), content=None):
    return SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content=content, tool_calls=list(tool_calls)))]
    )


def _tool_call(call_id, name, arguments: dict):
    return SimpleNamespace(
        id=call_id, function=SimpleNamespace(name=name, arguments=json.dumps(arguments))
    )


@pytest.fixture
def zabbix_client(mocker):
    def _make(event_id, host_id="10084", host_name="web-server", trigger="High CPU load"):
        client = mocker.MagicMock()
        client.problems.get.return_value = [
            {"eventid": event_id, "objectid": "1", "hostid": host_id, "severity": "3"}
        ]
        client.triggers.get.return_value = [
            {
                "description": trigger,
                "hosts": [{"hostid": host_id, "host": host_name, "name": host_name}],
            }
        ]
        mocker.patch("remediation.services.agent_loop.get_zabbix_client", return_value=client)
        return client

    return _make


@pytest.mark.django_db
class TestHumanTakeoverHaltsAgentLoop:
    def test_intervention_during_final_tool_call_skips_finalize(self, zabbix_client, mocker):
        """Human intervenes in the window between the model's response and the
        loop's next check — simulated by flipping human_intervened_at as a side
        effect of the single LLM call, right as it hands back propose_remediation."""
        zabbix_client("5001")
        incident = Incident.objects.create(
            zabbix_event_id="5001",
            zabbix_host_id="10084",
            host_name="web-server",
            trigger_name="High CPU load",
            severity="High",
            status="investigating",
        )

        def fake_create(**kwargs):
            Incident.objects.filter(pk=incident.pk).update(human_intervened_at=timezone.now())
            return _completion(
                tool_calls=[
                    _tool_call(
                        "call_1",
                        "propose_remediation",
                        {
                            "script_name": "none",
                            "reasoning": "test",
                            "confidence": "low",
                            "script_command": "",
                        },
                    )
                ]
            )

        mock_client = mocker.patch("remediation.services.agent_loop.get_client")
        mock_client.return_value.chat.completions.create.side_effect = fake_create

        agent_loop.run_agent_loop("5001", force=True)

        incident.refresh_from_db()
        assert incident.status == "investigating"  # never finalized
        assert incident.resolved_at is None
        assert not RemediationAction.objects.filter(incident=incident).exists()
        assert AgentStep.objects.filter(
            incident=incident, role="final", tool_output__icontains="Halted"
        ).exists()

    def test_intervention_between_iterations_stops_further_llm_calls(self, zabbix_client, mocker):
        zabbix_client("5002")
        incident = Incident.objects.create(
            zabbix_event_id="5002",
            zabbix_host_id="10084",
            host_name="web-server",
            trigger_name="High CPU load",
            severity="High",
            status="investigating",
        )

        def fake_create(**kwargs):
            Incident.objects.filter(pk=incident.pk).update(human_intervened_at=timezone.now())
            return _completion(tool_calls=[], content="still looking into it")

        mock_client = mocker.patch("remediation.services.agent_loop.get_client")
        mock_client.return_value.chat.completions.create.side_effect = fake_create

        agent_loop.run_agent_loop("5002", force=True)

        assert mock_client.return_value.chat.completions.create.call_count == 1
        incident.refresh_from_db()
        assert incident.status == "investigating"
        assert not RemediationAction.objects.filter(incident=incident).exists()

    def test_already_intervened_incident_never_calls_the_model(self, zabbix_client, mocker):
        zabbix_client("5003")
        Incident.objects.create(
            zabbix_event_id="5003",
            zabbix_host_id="10084",
            host_name="web-server",
            trigger_name="High CPU load",
            severity="High",
            status="dismissed",
            human_intervened_at=timezone.now(),
        )
        mock_client = mocker.patch("remediation.services.agent_loop.get_client")

        agent_loop.run_agent_loop("5003")

        mock_client.return_value.chat.completions.create.assert_not_called()


@pytest.mark.django_db
class TestForceRetryOverridesHumanTakeover:
    def test_force_clears_prior_intervention_and_finalizes_normally(self, zabbix_client, mocker):
        """--retry (force=True) is an explicit operator override: it should hand
        a previously-dismissed-by-a-human incident back to the agent, not have
        the stale human_intervened_at immediately halt the very run meant to
        override it."""
        zabbix_client("5004")
        incident = Incident.objects.create(
            zabbix_event_id="5004",
            zabbix_host_id="10084",
            host_name="web-server",
            trigger_name="High CPU load",
            severity="High",
            status="dismissed",
            human_intervened_at=timezone.now(),
            human_intervention_note="handled manually",
        )
        mock_client = mocker.patch("remediation.services.agent_loop.get_client")
        mock_client.return_value.chat.completions.create.return_value = _completion(
            tool_calls=[
                _tool_call(
                    "call_1",
                    "propose_remediation",
                    {
                        "script_name": "none",
                        "reasoning": "false alarm",
                        "confidence": "low",
                        "script_command": "",
                    },
                )
            ]
        )

        agent_loop.run_agent_loop("5004", force=True)

        incident.refresh_from_db()
        assert incident.human_intervened_at is None
        assert incident.human_intervention_note == ""
        assert incident.status == "escalated"
        assert incident.resolved_at is not None
