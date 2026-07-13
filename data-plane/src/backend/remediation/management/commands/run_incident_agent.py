"""
Long-running poller: watches Zabbix for new problems and runs the ReAct agent loop
for each one in a bounded thread pool.

Structurally similar to testlab/agent/agent.py's loop but production-grade: reuses
the shared monitoring.zabbix_client singleton instead of a hand-rolled RPC client,
and dedupes against the Incident table (DB-backed, survives restarts) instead of an
in-memory set().
"""

from __future__ import annotations

import logging
import time
from concurrent.futures import ThreadPoolExecutor

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import connections

from monitoring.zabbix_client import get_zabbix_client
from remediation.models import Incident
from remediation.services.agent_loop import run_agent_loop

logger = logging.getLogger(__name__)

ACTIVE_SEVERITIES = [2, 3, 4, 5]  # Warning and above


class Command(BaseCommand):
    help = "Poll Zabbix for new problems and run the incident response agent on each."

    def add_arguments(self, parser):
        parser.add_argument(
            "--poll-interval",
            type=int,
            default=None,
            help="Seconds between polls. Defaults to settings.AGENT_POLL_INTERVAL (30).",
        )
        parser.add_argument(
            "--max-workers",
            type=int,
            default=4,
            help="Max concurrent incidents processed at once.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            default=False,
            help="Log remediation decisions without executing Zabbix scripts.",
        )
        parser.add_argument(
            "--once",
            action="store_true",
            default=False,
            help="Poll a single time and exit (useful for testing/cron).",
        )

    def handle(self, *args, **options):
        poll_interval = options["poll_interval"] or getattr(settings, "AGENT_POLL_INTERVAL", 30)
        if options["dry_run"]:
            settings.AGENT_DRY_RUN = True

        self.stdout.write(
            self.style.SUCCESS(
                f"Incident agent polling every {poll_interval}s "
                f"(dry_run={bool(getattr(settings, 'AGENT_DRY_RUN', False))}). Ctrl-C to stop."
            )
        )

        with ThreadPoolExecutor(max_workers=options["max_workers"]) as executor:
            try:
                while True:
                    self._poll_once(executor)
                    if options["once"]:
                        break
                    time.sleep(poll_interval)
            except KeyboardInterrupt:
                self.stdout.write("Stopping...")

    def _poll_once(self, executor: ThreadPoolExecutor) -> None:
        try:
            client = get_zabbix_client()
            problems = client.problems.get(
                output="extend",
                severities=ACTIVE_SEVERITIES,
                sortfield="eventid",
                sortorder="DESC",
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to poll Zabbix problems: %s", exc)
            return

        known_ids = set(
            Incident.objects.filter(
                zabbix_event_id__in=[p["eventid"] for p in problems]
            ).values_list("zabbix_event_id", flat=True)
        )
        new_problems = [p for p in problems if p["eventid"] not in known_ids]
        if new_problems:
            self.stdout.write(f"Found {len(new_problems)} new problem(s).")

        for problem in new_problems:
            executor.submit(_run_and_cleanup, problem["eventid"])


def _run_and_cleanup(event_id: str) -> None:
    """Wrap run_agent_loop so each worker thread closes its DB connection when
    done — management commands don't get Django's request_finished cleanup."""
    try:
        run_agent_loop(event_id)
    except Exception:  # noqa: BLE001
        logger.exception("Unhandled error running agent loop for event %s", event_id)
    finally:
        connections.close_all()
