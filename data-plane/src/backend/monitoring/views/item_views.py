from rest_framework import status, viewsets
from rest_framework.response import Response

from ..constants import API_ITEM_STATUS
from ..mappers import item_type_to_zabbix, map_item, value_type_to_zabbix
from .mixins import ZabbixViewMixin, zabbix_action


class ItemViewSet(ZabbixViewMixin, viewsets.ViewSet):
    @zabbix_action
    def list(self, request):
        zabbix = self.get_zabbix()
        params: dict = {
            "output": "extend",
            "selectHosts": ["hostid", "name", "host"],
            "selectTemplates": ["templateid", "name", "host"],
        }
        search = request.query_params.get("search")
        if search:
            params["search"] = {"name": search, "key_": search}
        if request.query_params.get("host"):
            params["hostids"] = [str(request.query_params["host"])]
        if request.query_params.get("template"):
            params["templateids"] = [str(request.query_params["template"])]
        if request.query_params.get("item_type"):
            from ..constants import ITEM_TYPE_TO_ZABBIX

            ztype = ITEM_TYPE_TO_ZABBIX.get(request.query_params["item_type"])
            if ztype is not None:
                params["filter"] = {"type": ztype}
        if request.query_params.get("status"):
            params["filter"] = {
                **params.get("filter", {}),
                "status": API_ITEM_STATUS.get(request.query_params["status"], 0),
            }
        rows = zabbix.items.get(**params)
        return [map_item(row) for row in rows]

    @zabbix_action
    def retrieve(self, request, pk=None):
        rows = self.get_zabbix().items.get(
            itemids=[str(pk)],
            output="extend",
            selectHosts=["hostid", "name", "host"],
            selectTemplates=["templateid", "name", "host"],
        )
        if not rows:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return map_item(rows[0])

    @zabbix_action
    def create(self, request):
        zabbix = self.get_zabbix()
        data = request.data
        host_id = data.get("host")
        template_id = data.get("template")
        if not host_id and not template_id:
            return Response(
                {"detail": "host or template is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        hostid = str(host_id or template_id)
        ids = zabbix.items.create(
            name=data["name"],
            key_=data["key"],
            hostid=hostid,
            type=item_type_to_zabbix(data.get("item_type", "zabbix_agent")),
            value_type=value_type_to_zabbix(data.get("value_type", "float")),
            delay=data.get("delay", "1m"),
            history=data.get("history", "90d"),
            trends=data.get("trends", "365d"),
            units=data.get("units", ""),
            description=data.get("description", ""),
            snmp_oid=data.get("snmp_oid", ""),
            status=API_ITEM_STATUS.get(data.get("status", "enabled"), 0),
        )
        return self.retrieve(request, ids[0])

    @zabbix_action
    def update(self, request, pk=None):
        zabbix = self.get_zabbix()
        data = request.data
        params: dict = {}
        for field, zabbix_field in (
            ("name", "name"),
            ("key", "key_"),
            ("delay", "delay"),
            ("history", "history"),
            ("trends", "trends"),
            ("units", "units"),
            ("description", "description"),
            ("snmp_oid", "snmp_oid"),
        ):
            if field in data:
                params[zabbix_field] = data[field]
        if "item_type" in data:
            params["type"] = item_type_to_zabbix(data["item_type"])
        if "value_type" in data:
            params["value_type"] = value_type_to_zabbix(data["value_type"])
        if "status" in data:
            params["status"] = API_ITEM_STATUS.get(data["status"], 0)
        if params:
            zabbix.items.update(str(pk), **params)
        return self.retrieve(request, pk)

    @zabbix_action
    def partial_update(self, request, pk=None):
        return self.update(request, pk)

    @zabbix_action
    def destroy(self, request, pk=None):
        self.get_zabbix().items.delete(str(pk))
        return Response(status=status.HTTP_204_NO_CONTENT)
