from __future__ import annotations

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from lib.zabbix.events import ACTION_ACKNOWLEDGE, ACTION_CLOSE, ACTION_MESSAGE

from ..constants import API_SEVERITY
from ..mappers import map_problem
from .mixins import ZabbixViewMixin, zabbix_action


class ProblemViewSet(ZabbixViewMixin, viewsets.ViewSet):
    @zabbix_action
    def list(self, request):
        zabbix = self.get_zabbix()
        problem_status = request.query_params.get("status", "active")

        if problem_status == "resolved":
            return self._list_resolved_events(request)

        params: dict = {
            "output": "extend",
            "selectTags": "extend",
            "sortfield": "eventid",
            "sortorder": "DESC",
        }
        if request.query_params.get("host"):
            params["hostids"] = [str(request.query_params["host"])]
        if request.query_params.get("host_group"):
            params["groupids"] = [str(request.query_params["host_group"])]
        if request.query_params.get("severity"):
            params["severities"] = [API_SEVERITY[request.query_params["severity"]]]
        if request.query_params.get("acknowledged") == "true":
            params["acknowledged"] = 1
        elif request.query_params.get("acknowledged") == "false":
            params["acknowledged"] = 0

        search = request.query_params.get("search")
        rows = zabbix.problems.get(**params)

        host_names = self._host_names_for_problems(rows)
        mapped = []
        for row in rows:
            hostid = row.get("hostid")
            if search and search.lower() not in (row.get("name") or "").lower():
                if (
                    hostid not in host_names
                    or search.lower() not in host_names.get(hostid, "").lower()
                ):
                    continue
            mapped.append(
                map_problem(
                    row,
                    host_name=host_names.get(hostid) if hostid else None,
                )
            )
        return mapped

    def _list_resolved_events(self, request):
        """Resolved problems are fetched from the event API (value=OK)."""
        zabbix = self.get_zabbix()
        params: dict = {
            "output": "extend",
            "source": 0,
            "object": 0,
            "value": 0,
            "selectHosts": ["hostid", "name", "host"],
            "selectRelatedObject": ["triggerid", "description"],
            "selectTags": "extend",
            "sortfield": "clock",
            "sortorder": "DESC",
            "limit": 500,
        }
        if request.query_params.get("host"):
            params["hostids"] = [str(request.query_params["host"])]
        rows = zabbix.events.get(**params)
        results = []
        for row in rows:
            hosts = row.get("hosts") or []
            host_name = hosts[0].get("name") or hosts[0].get("host") if hosts else None
            problem = {
                "eventid": row["eventid"],
                "name": row.get("name") or row.get("relatedObject", {}).get("description", ""),
                "severity": row.get("severity", 0),
                "clock": row.get("clock"),
                "r_clock": row.get("clock"),
                "acknowledged": row.get("acknowledged", 0),
                "objectid": row.get("objectid"),
                "hostid": hosts[0]["hostid"] if hosts else None,
                "tags": row.get("tags") or [],
            }
            results.append(map_problem(problem, host_name=host_name))
        return results

    def _host_names_for_problems(self, problems: list[dict]) -> dict[str, str]:
        zabbix = self.get_zabbix()
        hostids = list({p["hostid"] for p in problems if p.get("hostid")})
        if hostids:
            hosts = zabbix.hosts.get(hostids=hostids, output=["hostid", "name", "host"])
            return {h["hostid"]: h.get("name") or h.get("host", "") for h in hosts}
        trigger_ids = list({p["objectid"] for p in problems if p.get("objectid")})
        if not trigger_ids:
            return {}
        triggers = zabbix.triggers.get(
            triggerids=trigger_ids,
            output=["triggerid"],
            selectHosts=["hostid", "name", "host"],
        )
        names: dict[str, str] = {}
        for trigger in triggers:
            hosts = trigger.get("hosts") or []
            if hosts:
                names[hosts[0]["hostid"]] = hosts[0].get("name") or hosts[0].get("host", "")
        return names

    @zabbix_action
    def retrieve(self, request, pk=None):
        zabbix = self.get_zabbix()
        rows = zabbix.problems.get(
            eventids=[str(pk)],
            output="extend",
            selectTags="extend",
        )
        if rows:
            host_names = self._host_names_for_problems(rows)
            return map_problem(rows[0], host_name=host_names.get(rows[0].get("hostid")))
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    @zabbix_action
    def create(self, request):
        return Response(
            {"detail": "Problems are created by Zabbix triggers, not manually."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    @action(detail=True, methods=["post"])
    @zabbix_action
    def acknowledge(self, request, pk=None):
        zabbix = self.get_zabbix()
        message = request.data.get("message", "")
        action = ACTION_ACKNOWLEDGE | ACTION_MESSAGE
        zabbix.events.acknowledge(str(pk), action, message=message)
        return self.retrieve(request, pk)

    @action(detail=True, methods=["post"])
    @zabbix_action
    def resolve(self, request, pk=None):
        zabbix = self.get_zabbix()
        zabbix.events.acknowledge(str(pk), ACTION_CLOSE)
        rows = zabbix.events.get(
            eventids=[str(pk)],
            output="extend",
            selectHosts=["hostid", "name", "host"],
            selectTags="extend",
        )
        if not rows:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        hosts = rows[0].get("hosts") or []
        host_name = hosts[0].get("name") if hosts else None
        problem = {
            **rows[0],
            "r_clock": rows[0].get("clock"),
        }
        return map_problem(problem, host_name=host_name)

    @zabbix_action
    def destroy(self, request, pk=None):
        return Response(
            {"detail": "Problems cannot be deleted directly."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )
