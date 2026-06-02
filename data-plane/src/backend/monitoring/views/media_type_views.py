from rest_framework import status, viewsets
from rest_framework.response import Response

from ..constants import API_ACTION_STATUS, API_MEDIA_TYPE
from ..mappers import map_media_type
from .mixins import ZabbixViewMixin, zabbix_action


class MediaTypeViewSet(ZabbixViewMixin, viewsets.ViewSet):
    @zabbix_action
    def list(self, request):
        zabbix = self.get_zabbix()
        params: dict = {"output": "extend"}
        search = request.query_params.get("search")
        if search:
            params["search"] = {"name": search}
        if request.query_params.get("media_type"):
            params["filter"] = {"type": API_MEDIA_TYPE.get(request.query_params["media_type"], 0)}
        if request.query_params.get("status"):
            params["filter"] = {
                **params.get("filter", {}),
                "status": API_ACTION_STATUS.get(request.query_params["status"], 0),
            }
        rows = zabbix.mediatypes.get(**params)
        return [map_media_type(row) for row in rows]

    @zabbix_action
    def retrieve(self, request, pk=None):
        rows = self.get_zabbix().mediatypes.get(mediatypeids=[str(pk)], output="extend")
        if not rows:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return map_media_type(rows[0])

    @zabbix_action
    def create(self, request):
        zabbix = self.get_zabbix()
        data = request.data
        name = data.get("name", "").strip()
        if not name:
            return Response({"detail": "name is required."}, status=status.HTTP_400_BAD_REQUEST)
        media_type = API_MEDIA_TYPE.get(data.get("media_type", "email"), 0)
        extra: dict = {"description": data.get("description", "")}
        if media_type == 0:
            extra.update(
                {
                    "smtp_server": data.get("smtp_server", ""),
                    "smtp_port": str(data.get("smtp_port", 25)),
                    "smtp_email": data.get("smtp_email", ""),
                }
            )
        ids = zabbix.mediatypes.create(name, type=media_type, **extra)
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
        if "smtp_server" in data:
            params["smtp_server"] = data["smtp_server"]
        if "smtp_port" in data:
            params["smtp_port"] = str(data["smtp_port"])
        if "smtp_email" in data:
            params["smtp_email"] = data["smtp_email"]
        if params:
            zabbix.mediatypes.update(str(pk), **params)
        return self.retrieve(request, pk)

    @zabbix_action
    def partial_update(self, request, pk=None):
        return self.update(request, pk)

    @zabbix_action
    def destroy(self, request, pk=None):
        self.get_zabbix().mediatypes.delete(str(pk))
        return Response(status=status.HTTP_204_NO_CONTENT)
