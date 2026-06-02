from rest_framework import status, viewsets
from rest_framework.response import Response

from ..constants import API_SEVERITY
from ..mappers import map_event
from .mixins import ZabbixViewMixin, zabbix_action


class EventViewSet(ZabbixViewMixin, viewsets.ViewSet):
    @zabbix_action
    def list(self, request):
        zabbix = self.get_zabbix()
        params: dict = {
            "output": "extend",
            "selectHosts": ["hostid", "name", "host"],
            "selectRelatedObject": ["triggerid", "description"],
            "selectTags": "extend",
            "sortfield": "clock",
            "sortorder": "DESC",
            "limit": 500,
        }
        source = request.query_params.get("source")
        if source:
            from ..constants import API_EVENT_SOURCE

            if source in API_EVENT_SOURCE:
                params["source"] = API_EVENT_SOURCE[source]
        value = request.query_params.get("value")
        if value == "problem":
            params["value"] = 1
        elif value == "ok":
            params["value"] = 0
        if request.query_params.get("host"):
            params["hostids"] = [str(request.query_params["host"])]
        if request.query_params.get("trigger"):
            params["objectids"] = [str(request.query_params["trigger"])]
        if request.query_params.get("severity"):
            params["severities"] = [API_SEVERITY[request.query_params["severity"]]]
        if request.query_params.get("host_group"):
            params["groupids"] = [str(request.query_params["host_group"])]
        rows = zabbix.events.get(**params)
        return [map_event(row) for row in rows]

    @zabbix_action
    def retrieve(self, request, pk=None):
        rows = self.get_zabbix().events.get(
            eventids=[str(pk)],
            output="extend",
            selectHosts=["hostid", "name", "host"],
            selectRelatedObject=["triggerid", "description"],
            selectTags="extend",
        )
        if not rows:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return map_event(rows[0])
