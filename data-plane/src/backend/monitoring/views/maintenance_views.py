from datetime import datetime, timezone

from rest_framework import status, viewsets
from rest_framework.response import Response

from ..constants import API_MAINTENANCE_TYPE
from ..mappers import map_host, map_host_group, map_maintenance
from .mixins import ZabbixViewMixin, zabbix_action


def _to_unix_ts(value: str) -> int:
    if not value:
        return 0
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return int(dt.timestamp())
    except ValueError:
        return 0


class MaintenanceWindowViewSet(ZabbixViewMixin, viewsets.ViewSet):
    @zabbix_action
    def list(self, request):
        zabbix = self.get_zabbix()
        params: dict = {"output": "extend"}
        search = request.query_params.get("search")
        if search:
            params["search"] = {"name": search}
        rows = zabbix.maintenance.get(**params)
        return [map_maintenance(row) for row in rows]

    @zabbix_action
    def retrieve(self, request, pk=None):
        zabbix = self.get_zabbix()
        rows = zabbix.maintenance.get(maintenanceids=[str(pk)], output="extend")
        if not rows:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        row = rows[0]
        hosts_detail = []
        if row.get("hostids"):
            host_rows = zabbix.hosts.get(
                hostids=row["hostids"],
                output="extend",
                selectInterfaces="extend",
                selectGroups="extend",
            )
            hosts_detail = [map_host(h) for h in host_rows]
        groups_detail = []
        if row.get("groupids"):
            group_rows = zabbix.hostgroups.get(groupids=row["groupids"], output="extend")
            groups_detail = [map_host_group(g) for g in group_rows]
        return map_maintenance(row, hosts_detail=hosts_detail, groups_detail=groups_detail)

    @zabbix_action
    def create(self, request):
        zabbix = self.get_zabbix()
        data = request.data
        name = data.get("name", "").strip()
        if not name:
            return Response({"detail": "name is required."}, status=status.HTTP_400_BAD_REQUEST)
        payload: dict = {
            "name": name,
            "active_since": _to_unix_ts(data.get("active_since", "")),
            "active_till": _to_unix_ts(data.get("active_till", "")),
            "maintenance_type": API_MAINTENANCE_TYPE.get(
                data.get("maintenance_type", "with_data_collection"), 0
            ),
            "description": data.get("description", ""),
        }
        if data.get("hosts"):
            payload["hostids"] = [str(h) for h in data["hosts"]]
        if data.get("host_groups"):
            payload["groupids"] = [str(g) for g in data["host_groups"]]
        name = payload.pop("name")
        ids = zabbix.maintenance.create(name, **payload)
        return self.retrieve(request, ids[0])

    @zabbix_action
    def update(self, request, pk=None):
        zabbix = self.get_zabbix()
        data = request.data
        params: dict = {}
        if "name" in data:
            params["name"] = data["name"]
        if "description" in data:
            params["description"] = data["description"]
        if "active_since" in data:
            params["active_since"] = _to_unix_ts(data["active_since"])
        if "active_till" in data:
            params["active_till"] = _to_unix_ts(data["active_till"])
        if "maintenance_type" in data:
            params["maintenance_type"] = API_MAINTENANCE_TYPE.get(data["maintenance_type"], 0)
        if "hosts" in data:
            params["hostids"] = [str(h) for h in data["hosts"]]
        if "host_groups" in data:
            params["groupids"] = [str(g) for g in data["host_groups"]]
        if params:
            zabbix.maintenance.update(str(pk), **params)
        return self.retrieve(request, pk)

    @zabbix_action
    def partial_update(self, request, pk=None):
        return self.update(request, pk)

    @zabbix_action
    def destroy(self, request, pk=None):
        self.get_zabbix().maintenance.delete(str(pk))
        return Response(status=status.HTTP_204_NO_CONTENT)
