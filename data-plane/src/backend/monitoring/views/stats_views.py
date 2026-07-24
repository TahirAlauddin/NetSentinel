from datetime import datetime, timezone

from rest_framework.views import APIView

from ..constants import API_SEVERITY, SEVERITY_TO_API
from ..zabbix_client import get_zabbix_client
from .mixins import ZabbixViewMixin


class MonitoringStatsView(ZabbixViewMixin, APIView):
    """
    Aggregated monitoring statistics from Zabbix.

    GET /api/v1/monitoring/stats/
    """

    def get(self, request):
        return self.zabbix_response(self._build_stats)

    def _build_stats(self):
        zabbix = get_zabbix_client()
        now = int(datetime.now(tz=timezone.utc).timestamp())

        hosts = zabbix.hosts.get(
            output=["hostid", "status"],
            selectInterfaces=["available"],
            filter={"flags": "0"},
        )
        problems = zabbix.problems.get(output=["eventid", "severity", "acknowledged"])

        templates = zabbix.templates.get(countOutput=True)
        template_count = int(templates) if isinstance(templates, str) else len(templates or [])

        items = zabbix.items.get(countOutput=True, monitored_hosts=1)
        item_count = int(items) if isinstance(items, str) else len(items or [])

        triggers = zabbix.triggers.get(output=["triggerid", "status", "value"], limit=10000)
        trigger_total = len(triggers)
        trigger_enabled = sum(1 for t in triggers if str(t.get("status")) == "0")
        trigger_in_problem = sum(1 for t in triggers if str(t.get("value")) == "1")

        host_groups = zabbix.hostgroups.get(countOutput=True)
        host_group_count = (
            int(host_groups) if isinstance(host_groups, str) else len(host_groups or [])
        )

        maintenance_rows = zabbix.maintenance.get(
            output=["maintenanceid", "active_since", "active_till"]
        )

        return {
            "hosts": self._host_stats(hosts),
            "problems": self._problem_stats(problems),
            "templates": template_count,
            "items": item_count,
            "triggers": {
                "total": trigger_total,
                "enabled": trigger_enabled,
                "in_problem": trigger_in_problem,
            },
            "host_groups": host_group_count,
            "active_maintenance": self._count_active_maintenance(maintenance_rows, now),
        }

    @staticmethod
    def _host_stats(hosts):
        total_hosts = len(hosts)
        monitored = sum(1 for h in hosts if str(h.get("status")) == "0")
        available = 0
        unavailable = 0
        unknown = 0
        for host in hosts:
            interfaces = host.get("interfaces") or []
            avail = 0
            for iface in interfaces:
                a = int(iface.get("available", 0))
                if a == 2:
                    avail = 2
                    break
                if a == 1:
                    avail = 1
            if avail == 2:
                unavailable += 1
            elif avail == 1:
                available += 1
            else:
                unknown += 1
        return {
            "total": total_hosts,
            "monitored": monitored,
            "not_monitored": total_hosts - monitored,
            "available": available,
            "unavailable": unavailable,
            "unknown": unknown,
        }

    @staticmethod
    def _problem_stats(problems):
        active_problems = len(problems)
        unacknowledged = sum(1 for p in problems if str(p.get("acknowledged")) == "0")

        problems_by_severity = {key: 0 for key in API_SEVERITY}
        for problem in problems:
            sev_int = int(problem.get("severity", 0))
            sev_key = SEVERITY_TO_API.get(sev_int, ("not_classified", ""))[0]
            problems_by_severity[sev_key] = problems_by_severity.get(sev_key, 0) + 1

        return {
            "total_active": active_problems,
            "unacknowledged": unacknowledged,
            "by_severity": problems_by_severity,
        }

    @staticmethod
    def _count_active_maintenance(rows, now):
        active_maintenance = 0
        for row in rows:
            try:
                since = int(row.get("active_since", 0))
                till = int(row.get("active_till", 0))
                if since <= now <= till:
                    active_maintenance += 1
            except (TypeError, ValueError):
                continue
        return active_maintenance
