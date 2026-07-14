"""
Tests for the Django admin "Approve" button on RemediationAction — a GET
confirmation page and a POST that actually executes, both going through the
same approve_and_execute() used by the DRF endpoint (see test_remediation_views.py).
"""

import pytest
from django.contrib.auth.models import Group
from django.urls import reverse

from remediation.models import Incident, RemediationAction
from users.models import ExtendedGroup, PermissionBundle


def _grant_execute_remediation(user):
    bundle = PermissionBundle.objects.get(code="execute_remediation")
    group = Group.objects.create(name=f"execute-remediation-{user.pk}")
    ext = ExtendedGroup.objects.create(group=group)
    ext.bundles.add(bundle)
    user.groups.add(group)


@pytest.fixture
def incident(db):
    return Incident.objects.create(
        zabbix_event_id="2001",
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
def staff_user_without_bundle(db):
    """A staff user who can log into /admin/ but hasn't been granted the
    execute_remediation bundle — the button should refuse them."""
    from django.contrib.auth import get_user_model

    return get_user_model().objects.create_user(
        username="staffer",
        email="staffer@example.com",
        password="staffpass123",
        is_staff=True,
    )


def approve_url(action_id):
    return reverse("admin:remediation_remediationaction_approve", args=[action_id])


@pytest.mark.django_db
class TestRemediationActionAdminApprove:
    def test_get_shows_confirmation_page(self, admin_client, awaiting_action):
        response = admin_client.get(approve_url(awaiting_action.id))
        assert response.status_code == 200
        assert b"Approve" in response.content
        assert awaiting_action.zabbix_script_name.encode() in response.content

    def test_get_on_non_awaiting_action_redirects_without_rendering(
        self, admin_client, awaiting_action
    ):
        awaiting_action.status = "executed"
        awaiting_action.save(update_fields=["status"])

        response = admin_client.get(approve_url(awaiting_action.id))

        assert response.status_code == 302

    def test_post_executes_and_redirects(self, admin_client, awaiting_action, mocker):
        mocker.patch(
            "remediation.services.agent_loop.execute_remediation_script",
            return_value={"ok": True, "raw": {"response": "success"}},
        )

        response = admin_client.post(approve_url(awaiting_action.id))

        assert response.status_code == 302
        awaiting_action.refresh_from_db()
        assert awaiting_action.status == "executed"
        assert awaiting_action.incident.status == "remediated"

    def test_post_denied_without_bundle_does_not_execute(
        self, client, staff_user_without_bundle, awaiting_action, mocker
    ):
        client.force_login(staff_user_without_bundle)
        mock_exec = mocker.patch("remediation.services.agent_loop.execute_remediation_script")

        response = client.post(approve_url(awaiting_action.id))

        assert response.status_code == 302
        mock_exec.assert_not_called()
        awaiting_action.refresh_from_db()
        assert awaiting_action.status == "awaiting_approval"

    def test_post_allowed_with_bundle_even_without_superuser(
        self, client, staff_user_without_bundle, awaiting_action, mocker
    ):
        _grant_execute_remediation(staff_user_without_bundle)
        client.force_login(staff_user_without_bundle)
        mocker.patch(
            "remediation.services.agent_loop.execute_remediation_script",
            return_value={"ok": True, "raw": {"response": "success"}},
        )

        response = client.post(approve_url(awaiting_action.id))

        assert response.status_code == 302
        awaiting_action.refresh_from_db()
        assert awaiting_action.status == "executed"
        assert awaiting_action.approved_by_id == staff_user_without_bundle.id

    def test_post_rejects_non_awaiting_action(self, admin_client, awaiting_action, mocker):
        awaiting_action.status = "executed"
        awaiting_action.save(update_fields=["status"])
        mock_exec = mocker.patch("remediation.services.agent_loop.execute_remediation_script")

        response = admin_client.post(approve_url(awaiting_action.id))

        assert response.status_code == 302
        mock_exec.assert_not_called()
