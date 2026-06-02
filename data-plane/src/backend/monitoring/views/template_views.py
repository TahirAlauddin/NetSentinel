from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..mappers import map_item, map_template, map_trigger
from .mixins import ZabbixViewMixin, zabbix_action


class TemplateViewSet(ZabbixViewMixin, viewsets.ViewSet):
    @zabbix_action
    def list(self, request):
        zabbix = self.get_zabbix()
        params = {
            "output": ["templateid", "host", "name", "description"],
            "selectGroups": "extend",
            "selectParentTemplates": ["templateid", "name"],
            "selectTags": "extend",
        }
        search = request.query_params.get("search")
        if search:
            params["search"] = {"name": search, "host": search}
        host_group = request.query_params.get("host_group")
        if host_group:
            params["groupids"] = [str(host_group)]
        rows = zabbix.templates.get(**params)
        return [map_template(row) for row in rows]

    @zabbix_action
    def retrieve(self, request, pk=None):
        rows = self.get_zabbix().templates.get(
            templateids=[str(pk)],
            output=["templateid", "host", "name", "description"],
            selectGroups="extend",
            selectParentTemplates=["templateid", "name"],
            selectTags="extend",
        )
        if not rows:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return map_template(rows[0])

    @zabbix_action
    def create(self, request):
        zabbix = self.get_zabbix()
        name = request.data.get("name", "").strip()
        if not name:
            return Response({"detail": "name is required."}, status=status.HTTP_400_BAD_REQUEST)
        groups = request.data.get("host_groups") or []
        if not groups:
            return Response(
                {"detail": "At least one host group is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ids = zabbix.templates.create(
            host=name,
            groups=[{"groupid": str(g)} for g in groups],
            name=name,
            description=request.data.get("description", ""),
        )
        return self.retrieve(request, ids[0])

    @zabbix_action
    def update(self, request, pk=None):
        zabbix = self.get_zabbix()
        params: dict = {}
        if "name" in request.data:
            params["host"] = request.data["name"]
            params["name"] = request.data["name"]
        if "description" in request.data:
            params["description"] = request.data["description"]
        if "host_groups" in request.data:
            params["groups"] = [{"groupid": str(g)} for g in request.data["host_groups"]]
        if params:
            zabbix.templates.update(str(pk), **params)
        return self.retrieve(request, pk)

    @zabbix_action
    def partial_update(self, request, pk=None):
        return self.update(request, pk)

    @zabbix_action
    def destroy(self, request, pk=None):
        self.get_zabbix().templates.delete(str(pk))
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["get"])
    @zabbix_action
    def items(self, request, pk=None):
        rows = self.get_zabbix().items.get(
            templateids=[str(pk)],
            output="extend",
            selectTemplates=["templateid", "name", "host"],
        )
        return [map_item(row) for row in rows]

    @action(detail=True, methods=["get"])
    @zabbix_action
    def triggers(self, request, pk=None):
        rows = self.get_zabbix().triggers.get(
            templateids=[str(pk)],
            output="extend",
            selectTemplates=["templateid", "name", "host"],
        )
        return [map_trigger(row) for row in rows]


class TemplateTagViewSet(ZabbixViewMixin, viewsets.ViewSet):
    @zabbix_action
    def list(self, request):
        template_id = request.query_params.get("template")
        if not template_id:
            return []
        rows = self.get_zabbix().templates.get(
            templateids=[str(template_id)],
            output=["templateid"],
            selectTags="extend",
        )
        if not rows:
            return []
        return [
            {"id": idx, "tag": t.get("tag", ""), "value": t.get("value", "")}
            for idx, t in enumerate(rows[0].get("tags") or [], start=1)
        ]

    @zabbix_action
    def destroy(self, request, pk=None):
        return Response(status=status.HTTP_204_NO_CONTENT)
