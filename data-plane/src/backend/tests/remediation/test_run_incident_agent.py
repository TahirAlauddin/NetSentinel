"""
Tests for run_incident_agent's poll/dispatch logic: new problems always get
dispatched, incidents that are still open (investigating/escalated) are left
alone until AGENT_INCIDENT_RETRY_TIMEOUT has elapsed since they were last
touched (they're often mid-flight async work — e.g. awaiting human approval —
not abandoned), and incidents in a terminal status or that a human has taken
over are never re-dispatched, timeout or not.
"""

from datetime import timedelta

import pytest
from django.utils import timezone

from remediation.management.commands.run_incident_agent import Command, _run_and_cleanup
from remediation.models import Incident


class _FakeExecutor:
    """Records submit() calls instead of actually running them — _poll_once's
    dispatch decisions are what's under test here, not the thread pool itself."""

    def __init__(self):
        self.calls = []

    def submit(self, fn, *args, **kwargs):
        self.calls.append((fn, args, kwargs))


@pytest.fixture
def stub_zabbix_problems(mocker):
    def _stub(problems):
        client = mocker.MagicMock()
        client.problems.get.return_value = problems
        mocker.patch(
            "remediation.management.commands.run_incident_agent.get_zabbix_client",
            return_value=client,
        )
        return client

    return _stub


def _backdate(incident, seconds):
    Incident.objects.filter(pk=incident.pk).update(
        updated_at=timezone.now() - timedelta(seconds=seconds)
    )


@pytest.mark.django_db
class TestPollOnceDispatch:
    def test_new_problem_is_dispatched(self, stub_zabbix_problems):
        stub_zabbix_problems([{"eventid": "9001", "name": "Disk full"}])
        executor = _FakeExecutor()

        Command()._poll_once(executor)

        assert len(executor.calls) == 1
        fn, args, kwargs = executor.calls[0]
        assert fn is _run_and_cleanup
        assert args == ("9001",)
        assert kwargs == {}

    def test_open_incident_within_timeout_is_left_alone(self, stub_zabbix_problems):
        Incident.objects.create(
            zabbix_event_id="9002", zabbix_host_id="1", host_name="h",
            trigger_name="t", severity="High", status="escalated",
        )
        stub_zabbix_problems([{"eventid": "9002", "name": "x"}])
        executor = _FakeExecutor()

        Command()._poll_once(executor)

        assert executor.calls == []

    def test_open_incident_past_timeout_is_retried(self, stub_zabbix_problems, settings):
        settings.AGENT_INCIDENT_RETRY_TIMEOUT = 60
        incident = Incident.objects.create(
            zabbix_event_id="9003", zabbix_host_id="1", host_name="h",
            trigger_name="t", severity="High", status="escalated",
        )
        _backdate(incident, 120)
        stub_zabbix_problems([{"eventid": "9003", "name": "x"}])
        executor = _FakeExecutor()

        Command()._poll_once(executor)

        assert len(executor.calls) == 1
        fn, args, kwargs = executor.calls[0]
        assert fn is _run_and_cleanup
        assert args == ("9003",)
        assert kwargs == {"force": True}

    def test_investigating_incident_past_timeout_is_also_retried(
        self, stub_zabbix_problems, settings
    ):
        """Covers the crash-recovery case: a worker died mid-run and the
        incident never made it to _finalize_incident, so it's stuck at the
        default 'investigating' status indefinitely."""
        settings.AGENT_INCIDENT_RETRY_TIMEOUT = 60
        incident = Incident.objects.create(
            zabbix_event_id="9006", zabbix_host_id="1", host_name="h",
            trigger_name="t", severity="High", status="investigating",
        )
        _backdate(incident, 120)
        stub_zabbix_problems([{"eventid": "9006", "name": "x"}])
        executor = _FakeExecutor()

        Command()._poll_once(executor)

        assert len(executor.calls) == 1

    def test_terminal_incident_is_never_retried_even_when_stale(
        self, stub_zabbix_problems, settings
    ):
        settings.AGENT_INCIDENT_RETRY_TIMEOUT = 60
        incident = Incident.objects.create(
            zabbix_event_id="9004", zabbix_host_id="1", host_name="h",
            trigger_name="t", severity="High", status="remediated",
        )
        _backdate(incident, 3600)
        stub_zabbix_problems([{"eventid": "9004", "name": "x"}])
        executor = _FakeExecutor()

        Command()._poll_once(executor)

        assert executor.calls == []

    def test_human_intervened_incident_is_never_retried_even_when_stale(
        self, stub_zabbix_problems, settings
    ):
        settings.AGENT_INCIDENT_RETRY_TIMEOUT = 60
        incident = Incident.objects.create(
            zabbix_event_id="9005", zabbix_host_id="1", host_name="h",
            trigger_name="t", severity="High", status="escalated",
            human_intervened_at=timezone.now(),
        )
        _backdate(incident, 3600)
        stub_zabbix_problems([{"eventid": "9005", "name": "x"}])
        executor = _FakeExecutor()

        Command()._poll_once(executor)

        assert executor.calls == []
