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
    help = (
        "Poll Zabbix for new problems and run the incident response agent on each. "
        "Pass -v 2 (Django's built-in --verbosity) for debug-level logs of every poll "
        "cycle, tool call, and guardrail check; AGENT_LOG_LEVEL env var sets the "
        "baseline level for all runs."
    )

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
        parser.add_argument(
            "--retry",
            nargs="+",
            metavar="EVENT_ID",
            default=None,
            help=(
                "Force re-run the agent loop for specific Zabbix event ID(s), even "
                "though each already has an Incident (e.g. you Ctrl-C'd a previous "
                "run and it's sitting there escalated with nothing actually fixed). "
                "Reuses the existing Incident and appends a new round of investigation "
                "steps/action to its history rather than starting over blind. Runs "
                "once for the given event(s) and exits — does not start the poll loop."
            ),
        )

    def handle(self, *args, **options):
        poll_interval = options["poll_interval"] or getattr(settings, "AGENT_POLL_INTERVAL", 30)
        if options["dry_run"]:
            settings.AGENT_DRY_RUN = True

        # --verbosity 2+ (Django's built-in flag) bumps the whole `remediation` logger
        # tree to DEBUG for this run, on top of whatever AGENT_LOG_LEVEL set globally —
        # so `-v 2` shows every tool call/result/guardrail check without an env change.
        if options.get("verbosity", 1) >= 2:
            logging.getLogger("remediation").setLevel(logging.DEBUG)
            logger.debug("Verbose logging enabled via --verbosity %d", options["verbosity"])

        if options["retry"]:
            self._retry_events(options["retry"])
            return

        logger.info(
            "Starting incident agent: poll_interval=%ds, max_workers=%d, dry_run=%s, "
            "zabbix_url=%s, model=%s",
            poll_interval,
            options["max_workers"],
            bool(getattr(settings, "AGENT_DRY_RUN", False)),
            getattr(settings, "ZABBIX_URL", "") or "(not configured)",
            getattr(settings, "AGENT_MODEL", "?"),
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Incident agent polling every {poll_interval}s "
                f"(dry_run={bool(getattr(settings, 'AGENT_DRY_RUN', False))}). Ctrl-C to stop."
            )
        )

        with ThreadPoolExecutor(max_workers=options["max_workers"]) as executor:
            try:
                cycle = 0
                while True:
                    cycle += 1
                    logger.debug("Poll cycle %d starting", cycle)
                    self._poll_once(executor)
                    if options["once"]:
                        break
                    logger.debug("Poll cycle %d done, sleeping %ds", cycle, poll_interval)
                    time.sleep(poll_interval)
            except KeyboardInterrupt:
                logger.info("Received interrupt; stopping incident agent.")
                self.stdout.write("Stopping...")

    def _poll_once(self, executor: ThreadPoolExecutor) -> None:
        logger.debug("Polling Zabbix for active problems (severities=%s)", ACTIVE_SEVERITIES)
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
        logger.info(
            "Poll result: %d active problem(s) in Zabbix, %d already tracked, %d new",
            len(problems), len(problems) - len(new_problems), len(new_problems),
        )
        if new_problems:
            self.stdout.write(f"Found {len(new_problems)} new problem(s).")

        for problem in new_problems:
            logger.info(
                "Dispatching event %s (%s) to the agent loop",
                problem["eventid"], problem.get("name", "N/A"),
            )
            executor.submit(_run_and_cleanup, problem["eventid"])

    def _retry_events(self, event_ids: list[str]) -> None:
        for event_id in event_ids:
            logger.info("Force-retrying event %s", event_id)
            self.stdout.write(f"Retrying event {event_id}...")
            _run_and_cleanup(event_id, force=True)
        self.stdout.write(self.style.SUCCESS(f"Done retrying {len(event_ids)} event(s)."))


def _run_and_cleanup(event_id: str, force: bool = False) -> None:
    """Wrap run_agent_loop so each worker thread closes its DB connection when
    done — management commands don't get Django's request_finished cleanup."""
    try:
        run_agent_loop(event_id, force=force)
    except Exception:  # noqa: BLE001
        logger.exception("Unhandled error running agent loop for event %s", event_id)
    finally:
        connections.close_all()
