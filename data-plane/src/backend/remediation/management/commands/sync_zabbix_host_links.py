"""
Refresh the ZabbixHostLink cache (host <-> asset/device correlation).

Meant to run on a much slower cadence than the incident poller — host/asset
topology changes rarely, unlike Zabbix problems. Safe to run manually before first
use of the agent, or on a system cron / scheduled task (no Celery Beat exists yet
in this project — see the plan's Context section).
"""

from __future__ import annotations

from django.core.management.base import BaseCommand
from django.utils import timezone

from monitoring.zabbix_client import get_zabbix_client
from remediation.models import ZabbixHostLink
from remediation.services.zabbix_correlation import match_host_to_asset


class Command(BaseCommand):
    help = "Sync ZabbixHostLink rows from Zabbix hosts.get, auto-matching to assets/devices."

    def handle(self, *args, **options):
        client = get_zabbix_client()
        hosts = client.hosts.get(
            output=["hostid", "host", "name"],
            selectInterfaces=["ip"],
        )

        manual_ids = set(
            ZabbixHostLink.objects.filter(match_source="manual").values_list(
                "zabbix_host_id", flat=True
            )
        )

        synced = 0
        skipped_manual = 0
        for host in hosts:
            host_id = host["hostid"]
            if host_id in manual_ids:
                skipped_manual += 1
                continue

            hostname = host.get("name") or host.get("host", "")
            interfaces = host.get("interfaces") or []
            ip_address = interfaces[0].get("ip") if interfaces else None
            ip_address = ip_address or None  # normalize "" to None

            match = match_host_to_asset(hostname, ip_address)

            ZabbixHostLink.objects.update_or_create(
                zabbix_host_id=host_id,
                defaults={
                    "zabbix_hostname": hostname,
                    "ip_address": ip_address,
                    "resolved_asset": match["asset"],
                    "resolved_device": match["device"],
                    "match_source": "auto",
                    "matched_at": timezone.now(),
                },
            )
            synced += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Synced {synced} host link(s), left {skipped_manual} manually-confirmed "
                "link(s) untouched."
            )
        )
