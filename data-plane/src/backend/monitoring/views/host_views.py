from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..constants import API_INVENTORY_MODE
from ..mappers import (
    host_status_to_zabbix,
    map_host,
    map_item,
    map_problem,
    map_trigger,
)
from ..services import build_host_problem_counts, fetch_hosts_with_filters
from .mixins import ZabbixViewMixin, zabbix_action


def _build_host_interfaces(data: dict) -> list[dict]:
    use_dns = data.get("use_dns", False)
    ip = data.get("ip_address") or ""
    dns = data.get("dns_name") or ""
    port = str(data.get("port", 10050))
    return [
        {
            "type": 1,
            "main": 1,
            "useip": 0 if use_dns else 1,
            "ip": "" if use_dns else ip,
            "dns": dns if use_dns else "",
            "port": port,
        }
    ]


def _host_create_payload(data: dict) -> dict:
    groups = data.get("host_groups") or []
    templates = data.get("templates") or []
    payload: dict = {
        "host": data["name"],
        "name": data.get("visible_name") or data["name"],
        "description": data.get("description", ""),
        "groups": [{"groupid": str(g)} for g in groups],
        "interfaces": _build_host_interfaces(data),
        "status": host_status_to_zabbix(data.get("status", "monitored")),
    }
    if templates:
        payload["templates"] = [{"templateid": str(t)} for t in templates]
    inv_mode = data.get("inventory_mode")
    if inv_mode and inv_mode in API_INVENTORY_MODE:
        payload["inventory_mode"] = API_INVENTORY_MODE[inv_mode]
        inventory_fields = (
            "location",
            "os",
            "hardware",
            "software",
            "asset_tag",
            "serial_number",
            "model",
            "vendor",
        )
        inventory = {}
        for field in inventory_fields:
            val = data.get(field)
            if val:
                key = "serialno_a" if field == "serial_number" else field
                inventory[key] = val
        if inventory:
            payload["inventory"] = inventory
    return payload


class HostViewSet(ZabbixViewMixin, viewsets.ViewSet):
    @zabbix_action
    def list(self, request):
        return fetch_hosts_with_filters(request.query_params)

    @zabbix_action
    def retrieve(self, request, pk=None):
        zabbix = self.get_zabbix()
        rows = zabbix.hosts.get(
            hostids=[str(pk)],
            output="extend",
            selectInterfaces="extend",
            selectGroups="extend",
            selectParentTemplates=["templateid", "name", "host"],
            selectTags="extend",
            selectInventory="extend",
        )
        if not rows:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        counts = build_host_problem_counts()
        return map_host(rows[0], problem_count=counts.get(str(pk), 0))

    @zabbix_action
    def create(self, request):
        zabbix = self.get_zabbix()
        if not request.data.get("name"):
            return Response({"detail": "name is required."}, status=status.HTTP_400_BAD_REQUEST)
        payload = _host_create_payload(request.data)
        interfaces = payload.pop("interfaces")
        groups = payload.pop("groups")
        host_name = payload.pop("host")
        ids = zabbix.hosts.create(host_name, groups, interfaces=interfaces, **payload)
        return self.retrieve(request, ids[0])

    @zabbix_action
    def update(self, request, pk=None):
        zabbix = self.get_zabbix()
        data = request.data
        params: dict = {}
        if "name" in data:
            params["host"] = data["name"]
        if "visible_name" in data:
            params["name"] = data["visible_name"]
        if "description" in data:
            params["description"] = data["description"]
        if "status" in data:
            params["status"] = host_status_to_zabbix(data["status"])
        if "host_groups" in data:
            params["groups"] = [{"groupid": str(g)} for g in data["host_groups"]]
        if "templates" in data:
            params["templates"] = [{"templateid": str(t)} for t in data["templates"]]
        if params:
            zabbix.hosts.update(str(pk), **params)
        return self.retrieve(request, pk)

    @zabbix_action
    def partial_update(self, request, pk=None):
        return self.update(request, pk)

    @zabbix_action
    def destroy(self, request, pk=None):
        self.get_zabbix().hosts.delete(str(pk))
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["get"])
    @zabbix_action
    def items(self, request, pk=None):
        rows = self.get_zabbix().items.get(
            hostids=[str(pk)],
            output="extend",
            selectHosts=["hostid", "name", "host"],
        )
        return [map_item(row) for row in rows]

    @action(detail=True, methods=["get"])
    @zabbix_action
    def triggers(self, request, pk=None):
        rows = self.get_zabbix().triggers.get(
            hostids=[str(pk)],
            output="extend",
            selectHosts=["hostid", "name", "host"],
        )
        return [map_trigger(row) for row in rows]

    @action(detail=True, methods=["get"])
    @zabbix_action
    def problems(self, request, pk=None):
        zabbix = self.get_zabbix()
        problems = zabbix.problems.get(
            hostids=[str(pk)],
            output="extend",
            selectTags="extend",
        )
        return [map_problem(p, host_name=None) for p in problems]

    @action(detail=True, methods=["post"])
    @zabbix_action
    def enable(self, request, pk=None):
        self.get_zabbix().hosts.update(str(pk), status=0)
        return {"detail": "Host enabled."}

    @action(detail=True, methods=["post"])
    @zabbix_action
    def disable(self, request, pk=None):
        self.get_zabbix().hosts.update(str(pk), status=1)
        return {"detail": "Host disabled."}


class HostTagViewSet(ZabbixViewMixin, viewsets.ViewSet):
    """Host tags are stored on the Zabbix host object."""

    @zabbix_action
    def list(self, request):
        host_id = request.query_params.get("host")
        if not host_id:
            return []
        rows = self.get_zabbix().hosts.get(
            hostids=[str(host_id)],
            output=["hostid"],
            selectTags="extend",
        )
        if not rows:
            return []
        return [
            {"id": idx, "tag": t.get("tag", ""), "value": t.get("value", "")}
            for idx, t in enumerate(rows[0].get("tags") or [], start=1)
        ]

    @zabbix_action
    def create(self, request):
        host_id = request.data.get("host")
        if not host_id:
            return Response({"detail": "host is required."}, status=status.HTTP_400_BAD_REQUEST)
        zabbix = self.get_zabbix()
        rows = zabbix.hosts.get(hostids=[str(host_id)], output=["hostid"], selectTags="extend")
        if not rows:
            return Response({"detail": "Host not found."}, status=status.HTTP_404_NOT_FOUND)
        tags = list(rows[0].get("tags") or [])
        tags.append({"tag": request.data.get("tag", ""), "value": request.data.get("value", "")})
        zabbix.hosts.update(str(host_id), tags=tags)
        return {"id": len(tags), "tag": request.data.get("tag", ""), "value": request.data.get("value", "")}

    @zabbix_action
    def destroy(self, request, pk=None):
        return Response(status=status.HTTP_204_NO_CONTENT)
