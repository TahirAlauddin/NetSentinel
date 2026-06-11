from rest_framework import status, viewsets
from rest_framework.response import Response

from ..mappers import map_template_group
from .mixins import ZabbixViewMixin, zabbix_action


class TemplateGroupViewSet(ZabbixViewMixin, viewsets.ViewSet):
    @zabbix_action
    def list(self, request):
        zabbix = self.get_zabbix()
        params = {
            "output": "extend",
            "selectTemplates": ["templateid"],
        }
        search = request.query_params.get("search")
        if search:
            params["search"] = {"name": search}
        rows = zabbix.templategroups.get(**params)
        return [
            map_template_group(row, template_count=len(row.get("templates") or []))
            for row in rows
        ]

    @zabbix_action
    def retrieve(self, request, pk=None):
        rows = self.get_zabbix().templategroups.get(
            groupids=[str(pk)],
            output="extend",
            selectTemplates=["templateid"],
        )
        if not rows:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        row = rows[0]
        return map_template_group(row, template_count=len(row.get("templates") or []))

    @zabbix_action
    def create(self, request):
        name = request.data.get("name", "").strip()
        if not name:
            return Response({"detail": "name is required."}, status=status.HTTP_400_BAD_REQUEST)
        ids = self.get_zabbix().templategroups.create(name)
        return self.retrieve(request, ids[0])

    @zabbix_action
    def update(self, request, pk=None):
        name = request.data.get("name", "").strip()
        if not name:
            return Response({"detail": "name is required."}, status=status.HTTP_400_BAD_REQUEST)
        self.get_zabbix().templategroups.update(str(pk), name)
        return self.retrieve(request, pk)

    @zabbix_action
    def partial_update(self, request, pk=None):
        return self.update(request, pk)

    @zabbix_action
    def destroy(self, request, pk=None):
        self.get_zabbix().templategroups.delete(str(pk))
        return Response(status=status.HTTP_204_NO_CONTENT)
