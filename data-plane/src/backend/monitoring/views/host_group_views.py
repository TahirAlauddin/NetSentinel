from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..mappers import map_host, map_host_group
from .mixins import ZabbixViewMixin, zabbix_action


class HostGroupViewSet(ZabbixViewMixin, viewsets.ViewSet):
    @zabbix_action
    def list(self, request):
        zabbix = self.get_zabbix()
        params = {"output": "extend", "selectHosts": ["hostid"]}
        search = request.query_params.get("search")
        if search:
            params["search"] = {"name": search}
        rows = zabbix.hostgroups.get(**params)
        return [
            map_host_group(row, host_count=len(row.get("hosts") or []))
            for row in rows
        ]

    @zabbix_action
    def retrieve(self, request, pk=None):
        zabbix = self.get_zabbix()
        rows = zabbix.hostgroups.get(
            groupids=[str(pk)],
            output="extend",
            selectHosts=["hostid"],
        )
        if not rows:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        row = rows[0]
        return map_host_group(row, host_count=len(row.get("hosts") or []))

    @zabbix_action
    def create(self, request):
        zabbix = self.get_zabbix()
        name = request.data.get("name", "").strip()
        if not name:
            return Response({"detail": "name is required."}, status=status.HTTP_400_BAD_REQUEST)
        ids = zabbix.hostgroups.create(name)
        rows = zabbix.hostgroups.get(groupids=ids, output="extend", selectHosts=["hostid"])
        return map_host_group(rows[0], host_count=len(rows[0].get("hosts") or []))

    @zabbix_action
    def update(self, request, pk=None):
        zabbix = self.get_zabbix()
        name = request.data.get("name", "").strip()
        if not name:
            return Response({"detail": "name is required."}, status=status.HTTP_400_BAD_REQUEST)
        zabbix.hostgroups.update(str(pk), name)
        return self.retrieve(request, pk)

    @zabbix_action
    def partial_update(self, request, pk=None):
        return self.update(request, pk)

    @zabbix_action
    def destroy(self, request, pk=None):
        self.get_zabbix().hostgroups.delete(str(pk))
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["get"])
    @zabbix_action
    def hosts(self, request, pk=None):
        zabbix = self.get_zabbix()
        rows = zabbix.hosts.get(
            groupids=[str(pk)],
            output="extend",
            selectInterfaces="extend",
            selectGroups="extend",
            selectParentTemplates=["templateid", "name", "host"],
        )
        return [map_host(row) for row in rows]
