from rest_framework import status, viewsets
from rest_framework.response import Response

from ..constants import API_ACTION_SOURCE, API_ACTION_STATUS
from ..mappers import map_action
from .mixins import ZabbixViewMixin, zabbix_action


class ActionViewSet(ZabbixViewMixin, viewsets.ViewSet):
    @zabbix_action
    def list(self, request):
        zabbix = self.get_zabbix()
        params: dict = {
            "output": "extend",
            "selectFilter": "extend",
            "selectOperations": "extend",
        }
        search = request.query_params.get("search")
        if search:
            params["search"] = {"name": search}
        if request.query_params.get("eventsource"):
            params["filter"] = {
                "eventsource": API_ACTION_SOURCE.get(request.query_params["eventsource"], 0)
            }
        if request.query_params.get("status"):
            params["filter"] = {
                **params.get("filter", {}),
                "status": API_ACTION_STATUS.get(request.query_params["status"], 0),
            }
        rows = zabbix.actions.get(**params)
        return [map_action(row) for row in rows]

    @zabbix_action
    def retrieve(self, request, pk=None):
        rows = self.get_zabbix().actions.get(
            actionids=[str(pk)],
            output="extend",
            selectFilter="extend",
            selectOperations="extend",
        )
        if not rows:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return map_action(rows[0])

    @zabbix_action
    def create(self, request):
        zabbix = self.get_zabbix()
        data = request.data
        name = data.get("name", "").strip()
        if not name:
            return Response({"detail": "name is required."}, status=status.HTTP_400_BAD_REQUEST)
        ids = zabbix.actions.create(
            name=name,
            eventsource=API_ACTION_SOURCE.get(data.get("eventsource", "trigger"), 0),
            status=API_ACTION_STATUS.get(data.get("status", "enabled"), 0),
        )
        return self.retrieve(request, ids[0])

    @zabbix_action
    def update(self, request, pk=None):
        zabbix = self.get_zabbix()
        data = request.data
        params: dict = {}
        if "name" in data:
            params["name"] = data["name"]
        if "eventsource" in data:
            params["eventsource"] = API_ACTION_SOURCE[data["eventsource"]]
        if "status" in data:
            params["status"] = API_ACTION_STATUS[data["status"]]
        if params:
            zabbix.actions.update(str(pk), **params)
        return self.retrieve(request, pk)

    @zabbix_action
    def partial_update(self, request, pk=None):
        return self.update(request, pk)

    @zabbix_action
    def destroy(self, request, pk=None):
        self.get_zabbix().actions.delete(str(pk))
        return Response(status=status.HTTP_204_NO_CONTENT)


class ActionConditionViewSet(ZabbixViewMixin, viewsets.ViewSet):
    @zabbix_action
    def list(self, request):
        action_id = request.query_params.get("action")
        if not action_id:
            return []
        rows = self.get_zabbix().actions.get(
            actionids=[str(action_id)],
            output="extend",
            selectFilter="extend",
        )
        if not rows:
            return []
        return map_action(rows[0]).get("conditions", [])

    @zabbix_action
    def destroy(self, request, pk=None):
        return Response(status=status.HTTP_204_NO_CONTENT)


class ActionOperationViewSet(ZabbixViewMixin, viewsets.ViewSet):
    @zabbix_action
    def list(self, request):
        action_id = request.query_params.get("action")
        if not action_id:
            return []
        rows = self.get_zabbix().actions.get(
            actionids=[str(action_id)],
            output="extend",
            selectOperations="extend",
        )
        if not rows:
            return []
        return map_action(rows[0]).get("operations", [])

    @zabbix_action
    def destroy(self, request, pk=None):
        return Response(status=status.HTTP_204_NO_CONTENT)
