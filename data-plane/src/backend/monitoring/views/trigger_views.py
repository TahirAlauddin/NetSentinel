from rest_framework import status, viewsets
from rest_framework.response import Response

from ..constants import API_SEVERITY, API_TRIGGER_STATUS
from ..mappers import map_trigger, severity_to_zabbix
from .mixins import ZabbixViewMixin, zabbix_action


class TriggerViewSet(ZabbixViewMixin, viewsets.ViewSet):
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
            params["search"] = {"description": search}
        if request.query_params.get("host"):
            params["hostids"] = [str(request.query_params["host"])]
        if request.query_params.get("template"):
            params["templateids"] = [str(request.query_params["template"])]
        if request.query_params.get("severity"):
            params["filter"] = {
                **params.get("filter", {}),
                "priority": API_SEVERITY.get(request.query_params["severity"], 3),
            }
        if request.query_params.get("status"):
            params["filter"] = {
                **params.get("filter", {}),
                "status": API_TRIGGER_STATUS.get(request.query_params["status"], 0),
            }
        if request.query_params.get("state") == "problem":
            params["only_true"] = 1
        rows = zabbix.triggers.get(**params)
        return [map_trigger(row) for row in rows]

    @zabbix_action
    def retrieve(self, request, pk=None):
        rows = self.get_zabbix().triggers.get(
            triggerids=[str(pk)],
            output="extend",
            selectHosts=["hostid", "name", "host"],
            selectTemplates=["templateid", "name", "host"],
        )
        if not rows:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return map_trigger(rows[0])

    @zabbix_action
    def create(self, request):
        zabbix = self.get_zabbix()
        data = request.data
        if not data.get("host") and not data.get("template"):
            return Response(
                {"detail": "host or template is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ids = zabbix.triggers.create(
            description=data["name"],
            expression=data["expression"],
            priority=severity_to_zabbix(data.get("severity", "average")),
            status=API_TRIGGER_STATUS.get(data.get("status", "enabled"), 0),
            comments=data.get("description", ""),
            url=data.get("url", ""),
        )
        return self.retrieve(request, ids[0])

    @zabbix_action
    def update(self, request, pk=None):
        zabbix = self.get_zabbix()
        data = request.data
        params: dict = {}
        if "name" in data:
            params["description"] = data["name"]
        if "expression" in data:
            params["expression"] = data["expression"]
        if "severity" in data:
            params["priority"] = severity_to_zabbix(data["severity"])
        if "status" in data:
            params["status"] = API_TRIGGER_STATUS.get(data["status"], 0)
        if "description" in data:
            params["comments"] = data["description"]
        if params:
            zabbix.triggers.update(str(pk), **params)
        return self.retrieve(request, pk)

    @zabbix_action
    def partial_update(self, request, pk=None):
        return self.update(request, pk)

    @zabbix_action
    def destroy(self, request, pk=None):
        self.get_zabbix().triggers.delete(str(pk))
        return Response(status=status.HTTP_204_NO_CONTENT)
