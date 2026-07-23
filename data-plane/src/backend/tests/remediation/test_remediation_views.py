"""
Tests for the remediation app's DRF API — in particular the RBAC gate on
RemediationAction.approve, since that's the one endpoint that can trigger a
real Zabbix script execution.
"""

import pytest
from django.contrib.auth.models import Group
from django.utils import timezone
from rest_framework import status

from remediation.models import Incident, RemediationAction
from users.models import ExtendedGroup, PermissionBundle


def _grant_execute_remediation(user):
    """Attach the execute_remediation PermissionBundle (seeded by remediation's
    post_migrate signal — see remediation/apps.py) to a fresh group and add the
    user to it."""
    bundle = PermissionBundle.objects.get(code="execute_remediation")
    group = Group.objects.create(name=f"execute-remediation-{user.pk}")
    ext = ExtendedGroup.objects.create(group=group)
    ext.bundles.add(bundle)
    user.groups.add(group)


@pytest.fixture
def incident(db):
    return Incident.objects.create(
        zabbix_event_id="1001",
        zabbix_host_id="10084",
        host_name="web-server",
        trigger_name="High CPU load",
        severity="High",
        status="investigating",
    )


@pytest.fixture
def awaiting_action(db, incident):
    return RemediationAction.objects.create(
        incident=incident,
        zabbix_script_name="restart-nginx",
        reasoning="CPU pegged by a runaway nginx worker.",
        confidence="medium",
        status="awaiting_approval",
    )


@pytest.fixture
def awaiting_generated_action(db, incident):
    return RemediationAction.objects.create(
        incident=incident,
        zabbix_script_name="web-clear-stale-sessions",
        reasoning="No registered script clears the session cache; wrote a scoped one.",
        confidence="medium",
        status="awaiting_approval",
        script_source="generated",
        generated_script_command="docker exec host-web-server rm -f /tmp/sessions/*.lock",
    )


@pytest.mark.api
@pytest.mark.django_db
class TestIncidentViewSet:
    def test_list_requires_authentication(self, api_client):
        response = api_client.get("/api/v1/remediation/incidents/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_authenticated(self, authenticated_api_client, incident):
        response = authenticated_api_client.get("/api/v1/remediation/incidents/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["host_name"] == "web-server"

    def test_retrieve_includes_steps_and_actions(
        self, authenticated_api_client, incident, awaiting_action
    ):
        response = authenticated_api_client.get(f"/api/v1/remediation/incidents/{incident.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["actions"][0]["zabbix_script_name"] == "restart-nginx"


@pytest.mark.api
@pytest.mark.django_db
class TestRemediationActionApprove:
    def test_approve_requires_authentication(self, api_client, awaiting_action):
        response = api_client.post(f"/api/v1/remediation/actions/{awaiting_action.id}/approve/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_approve_denied_without_bundle(self, authenticated_api_client, awaiting_action):
        response = authenticated_api_client.post(
            f"/api/v1/remediation/actions/{awaiting_action.id}/approve/"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        awaiting_action.refresh_from_db()
        assert awaiting_action.status == "awaiting_approval"

    def test_approve_rejects_non_awaiting_action(
        self, authenticated_api_client, user, awaiting_action
    ):
        _grant_execute_remediation(user)
        awaiting_action.status = "executed"
        awaiting_action.save(update_fields=["status"])

        response = authenticated_api_client.post(
            f"/api/v1/remediation/actions/{awaiting_action.id}/approve/"
        )
        assert response.status_code == status.HTTP_409_CONFLICT

    def test_approve_executes_and_updates_status(
        self, authenticated_api_client, user, awaiting_action, mocker
    ):
        _grant_execute_remediation(user)
        mocker.patch(
            "remediation.services.agent_loop.execute_remediation_script",
            return_value={"ok": True, "raw": {"response": "success"}},
        )

        response = authenticated_api_client.post(
            f"/api/v1/remediation/actions/{awaiting_action.id}/approve/"
        )

        assert response.status_code == status.HTTP_200_OK
        awaiting_action.refresh_from_db()
        assert awaiting_action.status == "executed"
        assert awaiting_action.approved_by_id == user.id
        assert awaiting_action.incident.status == "remediated"

    def test_approve_refuses_after_human_intervention(
        self, authenticated_api_client, user, awaiting_action
    ):
        _grant_execute_remediation(user)
        incident = awaiting_action.incident
        incident.human_intervened_at = timezone.now()
        incident.status = "dismissed"
        incident.save(update_fields=["human_intervened_at", "status"])

        response = authenticated_api_client.post(
            f"/api/v1/remediation/actions/{awaiting_action.id}/approve/"
        )

        assert response.status_code == status.HTTP_409_CONFLICT
        awaiting_action.refresh_from_db()
        assert awaiting_action.status == "awaiting_approval"

    def test_approve_marks_failed_when_execution_fails(
        self, authenticated_api_client, user, awaiting_action, mocker
    ):
        _grant_execute_remediation(user)
        mocker.patch(
            "remediation.services.agent_loop.execute_remediation_script",
            return_value={"ok": False, "error": "Zabbix is not configured."},
        )

        response = authenticated_api_client.post(
            f"/api/v1/remediation/actions/{awaiting_action.id}/approve/"
        )

        assert response.status_code == status.HTTP_200_OK
        awaiting_action.refresh_from_db()
        assert awaiting_action.status == "failed"
        assert awaiting_action.incident.status == "escalated"


@pytest.mark.api
@pytest.mark.django_db
class TestRemediationActionApproveGenerated:
    """Approving an agent-authored (script_source='generated') action must go
    through execute_generated_remediation_script, not the registered-script path,
    and must never bypass a guardrail block."""

    def test_approve_executes_generated_script(
        self, authenticated_api_client, user, awaiting_generated_action, mocker
    ):
        _grant_execute_remediation(user)
        mock_exec = mocker.patch(
            "remediation.services.agent_loop.execute_generated_remediation_script",
            return_value={"ok": True, "raw": {"response": "success"}, "scriptid": "999"},
        )
        mock_registered = mocker.patch(
            "remediation.services.agent_loop.execute_remediation_script"
        )

        response = authenticated_api_client.post(
            f"/api/v1/remediation/actions/{awaiting_generated_action.id}/approve/"
        )

        assert response.status_code == status.HTTP_200_OK
        mock_exec.assert_called_once_with(awaiting_generated_action)
        mock_registered.assert_not_called()
        awaiting_generated_action.refresh_from_db()
        assert awaiting_generated_action.status == "executed"
        assert awaiting_generated_action.approved_by_id == user.id
        assert awaiting_generated_action.incident.status == "remediated"

    def test_approve_refuses_when_guardrails_flagged(
        self, authenticated_api_client, user, awaiting_generated_action, mocker
    ):
        _grant_execute_remediation(user)
        awaiting_generated_action.guardrail_violations = ["host power-state change"]
        awaiting_generated_action.save(update_fields=["guardrail_violations"])
        mock_exec = mocker.patch(
            "remediation.services.agent_loop.execute_generated_remediation_script"
        )

        response = authenticated_api_client.post(
            f"/api/v1/remediation/actions/{awaiting_generated_action.id}/approve/"
        )

        assert response.status_code == status.HTTP_409_CONFLICT
        mock_exec.assert_not_called()
        awaiting_generated_action.refresh_from_db()
        assert awaiting_generated_action.status == "awaiting_approval"


@pytest.mark.api
@pytest.mark.django_db
class TestIncidentIntervene:
    def test_intervene_requires_authentication(self, api_client, incident):
        response = api_client.post(f"/api/v1/remediation/incidents/{incident.id}/intervene/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_intervene_denied_without_bundle(self, authenticated_api_client, incident):
        response = authenticated_api_client.post(
            f"/api/v1/remediation/incidents/{incident.id}/intervene/"
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN
        incident.refresh_from_db()
        assert incident.human_intervened_at is None

    def test_intervene_takes_over_and_cancels_pending_action(
        self, authenticated_api_client, user, incident, awaiting_action
    ):
        _grant_execute_remediation(user)

        response = authenticated_api_client.post(
            f"/api/v1/remediation/incidents/{incident.id}/intervene/",
            {"note": "I'll handle this one myself."},
        )

        assert response.status_code == status.HTTP_200_OK
        incident.refresh_from_db()
        assert incident.status == "dismissed"
        assert incident.human_intervened_at is not None
        assert incident.human_intervened_by_id == user.id
        assert incident.human_intervention_note == "I'll handle this one myself."

        awaiting_action.refresh_from_db()
        assert awaiting_action.status == "skipped"

    def test_intervene_sends_a_notification(
        self, authenticated_api_client, user, incident, mocker
    ):
        _grant_execute_remediation(user)
        mock_notify = mocker.patch("remediation.services.agent_loop.send_notification")

        response = authenticated_api_client.post(
            f"/api/v1/remediation/incidents/{incident.id}/intervene/",
            {"note": "handling this one manually"},
        )

        assert response.status_code == status.HTTP_200_OK
        mock_notify.assert_called_once()
        (title, message), kwargs = mock_notify.call_args
        assert incident.host_name in title
        assert "handling this one manually" in message
        assert kwargs["alert_type"] == "info"

    def test_intervene_rejects_already_terminal_incident(
        self, authenticated_api_client, user, incident
    ):
        _grant_execute_remediation(user)
        incident.status = "remediated"
        incident.save(update_fields=["status"])

        response = authenticated_api_client.post(
            f"/api/v1/remediation/incidents/{incident.id}/intervene/"
        )

        assert response.status_code == status.HTTP_409_CONFLICT
        incident.refresh_from_db()
        assert incident.human_intervened_at is None
