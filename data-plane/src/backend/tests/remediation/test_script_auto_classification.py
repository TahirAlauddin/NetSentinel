"""
Tests for auto-classifying registered-in-Zabbix scripts that have no
RemediationScriptPolicy yet (see agent_loop._lookup_and_scan_registered_script
and the `policy is None` branch of _finalize_incident).

Previously any script without a manually-created policy row always fell to
"requires human approval", regardless of how trivial/high-confidence the
decision was — every new script had to be pre-registered by a human before it
could ever auto-run. Now a never-before-seen script gets its actual Zabbix
command text scanned by the same static guardrail check agent-authored
scripts get: a clean scan + confidence=='high' auto-executes and remembers
the verdict as a low-risk policy; a flagged scan remembers it as high-risk
and still escalates for a human, exactly like before.
"""

import json
from types import SimpleNamespace

import pytest

from remediation.models import Incident, RemediationAction, RemediationScriptPolicy
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
    def _make(event_id, host_id="10084", host_name="cache-server", trigger="High eviction rate"):
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


def _propose(script_name, confidence, reasoning="test"):
    return _completion(
        tool_calls=[
            _tool_call(
                "call_1",
                "propose_remediation",
                {
                    "script_name": script_name,
                    "reasoning": reasoning,
                    "confidence": confidence,
                    "script_command": "",
                },
            )
        ]
    )


def _make_incident(event_id):
    return Incident.objects.create(
        zabbix_event_id=event_id,
        zabbix_host_id="10084",
        host_name="cache-server",
        trigger_name="High eviction rate",
        severity="High",
        status="investigating",
    )


@pytest.mark.django_db
class TestUnclassifiedRegisteredScriptAutoRisk:
    def test_clean_scan_and_high_confidence_auto_executes(self, zabbix_client, mocker):
        client = zabbix_client("6001")
        client.scripts.get.return_value = [{"scriptid": "55", "command": "systemctl restart redis"}]
        client.scripts.execute.return_value = {"response": "ok"}
        incident = _make_incident("6001")
        mock_llm = mocker.patch("remediation.services.agent_loop.get_client")
        mock_llm.return_value.chat.completions.create.return_value = _propose(
            "cache-restart", "high"
        )

        agent_loop.run_agent_loop("6001", force=True)

        incident.refresh_from_db()
        assert incident.status == "remediated"
        action = RemediationAction.objects.get(incident=incident)
        assert action.status == "executed"
        assert action.guardrail_violations is None

        policy = RemediationScriptPolicy.objects.get(zabbix_script_name="cache-restart")
        assert policy.auto_execute_allowed is True
        assert policy.risk_level == "low"

    def test_flagged_scan_still_escalates_and_is_classified_high_risk(self, zabbix_client, mocker):
        client = zabbix_client("6002")
        client.scripts.get.return_value = [{"scriptid": "56", "command": "rm -rf /"}]
        incident = _make_incident("6002")
        mock_llm = mocker.patch("remediation.services.agent_loop.get_client")
        mock_llm.return_value.chat.completions.create.return_value = _propose(
            "wipe-cache", "high"
        )

        agent_loop.run_agent_loop("6002", force=True)

        incident.refresh_from_db()
        assert incident.status == "escalated"
        action = RemediationAction.objects.get(incident=incident)
        assert action.status == "awaiting_approval"
        assert action.guardrail_violations

        policy = RemediationScriptPolicy.objects.get(zabbix_script_name="wipe-cache")
        assert policy.auto_execute_allowed is False
        assert policy.risk_level == "high"

    def test_clean_scan_but_confidence_not_high_still_requires_approval_this_time(
        self, zabbix_client, mocker
    ):
        client = zabbix_client("6003")
        client.scripts.get.return_value = [{"scriptid": "57", "command": "systemctl restart redis"}]
        incident = _make_incident("6003")
        mock_llm = mocker.patch("remediation.services.agent_loop.get_client")
        mock_llm.return_value.chat.completions.create.return_value = _propose(
            "cache-restart-2", "medium"
        )

        agent_loop.run_agent_loop("6003", force=True)

        incident.refresh_from_db()
        assert incident.status == "escalated"
        action = RemediationAction.objects.get(incident=incident)
        assert action.status == "awaiting_approval"

        # Classified for next time even though this run didn't auto-execute.
        policy = RemediationScriptPolicy.objects.get(zabbix_script_name="cache-restart-2")
        assert policy.auto_execute_allowed is True

    def test_second_incident_reuses_the_classification_without_rescanning(
        self, zabbix_client, mocker
    ):
        """Once a script has been classified, later incidents shouldn't need
        to re-scan its command text at all — the stored policy is
        authoritative until a human changes it. (scripts.get is still called
        once, by execute_remediation_script itself, to resolve the scriptid —
        that's unrelated to the risk-scan lookup under test here.)"""
        RemediationScriptPolicy.objects.create(
            zabbix_script_name="cache-restart-3", risk_level="low", auto_execute_allowed=True
        )
        client = zabbix_client("6004")
        client.scripts.get.return_value = [{"scriptid": "58"}]
        client.scripts.execute.return_value = {"response": "ok"}
        incident = _make_incident("6004")
        mock_llm = mocker.patch("remediation.services.agent_loop.get_client")
        mock_llm.return_value.chat.completions.create.return_value = _propose(
            "cache-restart-3", "high"
        )
        mock_scan = mocker.patch(
            "remediation.services.agent_loop._lookup_and_scan_registered_script"
        )

        agent_loop.run_agent_loop("6004", force=True)

        mock_scan.assert_not_called()
        incident.refresh_from_db()
        assert incident.status == "remediated"

    def test_script_not_found_in_zabbix_does_not_auto_execute(self, zabbix_client, mocker):
        client = zabbix_client("6005")
        client.scripts.get.return_value = []
        incident = _make_incident("6005")
        mock_llm = mocker.patch("remediation.services.agent_loop.get_client")
        mock_llm.return_value.chat.completions.create.return_value = _propose(
            "does-not-exist", "high"
        )

        agent_loop.run_agent_loop("6005", force=True)

        incident.refresh_from_db()
        assert incident.status == "escalated"
        action = RemediationAction.objects.get(incident=incident)
        assert action.status == "awaiting_approval"
        policy = RemediationScriptPolicy.objects.get(zabbix_script_name="does-not-exist")
        assert policy.auto_execute_allowed is False
