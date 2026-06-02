from rest_framework import status, viewsets
from rest_framework.response import Response

from ..constants import API_PROXY_MODE
from ..mappers import map_proxy
from .mixins import ZabbixViewMixin, zabbix_action


class ProxyViewSet(ZabbixViewMixin, viewsets.ViewSet):
    @zabbix_action
    def list(self, request):
        zabbix = self.get_zabbix()
        params: dict = {"output": "extend"}
        search = request.query_params.get("search")
        if search:
            params["search"] = {"name": search}
        rows = zabbix.proxies.get(**params)
        return [map_proxy(row) for row in rows]

    @zabbix_action
    def retrieve(self, request, pk=None):
        rows = self.get_zabbix().proxies.get(proxyids=[str(pk)], output="extend")
        if not rows:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return map_proxy(rows[0])

    @zabbix_action
    def create(self, request):
        zabbix = self.get_zabbix()
        data = request.data
        name = data.get("name", "").strip()
        if not name:
            return Response({"detail": "name is required."}, status=status.HTTP_400_BAD_REQUEST)
        ids = zabbix.proxies.create(
            name,
            mode=API_PROXY_MODE.get(data.get("mode", "active"), 5),
            address=data.get("address", ""),
            port=str(data.get("port", 10051)),
            description=data.get("description", ""),
        )
        return self.retrieve(request, ids[0])

    @zabbix_action
    def update(self, request, pk=None):
        zabbix = self.get_zabbix()
        data = request.data
        params: dict = {}
        if "name" in data:
            params["name"] = data["name"]
        if "mode" in data:
            params["mode"] = API_PROXY_MODE.get(data["mode"], 5)
        if "address" in data:
            params["address"] = data["address"]
        if "port" in data:
            params["port"] = str(data["port"])
        if "description" in data:
            params["description"] = data["description"]
        if params:
            zabbix.proxies.update(str(pk), **params)
        return self.retrieve(request, pk)

    @zabbix_action
    def partial_update(self, request, pk=None):
        return self.update(request, pk)

    @zabbix_action
    def destroy(self, request, pk=None):
        self.get_zabbix().proxies.delete(str(pk))
        return Response(status=status.HTTP_204_NO_CONTENT)
