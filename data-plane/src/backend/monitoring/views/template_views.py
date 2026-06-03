from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..mappers import map_item, map_template, map_trigger
from .mixins import ZabbixViewMixin, zabbix_action

_TEMPLATE_GET_PARAMS = {
    "output": ["templateid", "host", "name", "description"],
    "selectTemplateGroups": "extend",
    "selectParentTemplates": ["templateid", "name", "host"],
    "selectTags": "extend",
    "selectMacros": "extend",
    "selectValueMaps": "extend",
}


def _normalize_tags(tags: list | None) -> list[dict]:
    if not tags:
        return []
    result = []
    for t in tags:
        tag = (t.get("tag") or "").strip()
        if not tag:
            continue
        result.append({"tag": tag, "value": (t.get("value") or "").strip()})
    return result


def _normalize_macros(macros: list | None) -> list[dict]:
    if not macros:
        return []
    result = []
    for m in macros:
        macro = (m.get("macro") or "").strip()
        if not macro:
            continue
        entry: dict = {"macro": macro, "value": m.get("value", "")}
        desc = (m.get("description") or "").strip()
        if desc:
            entry["description"] = desc
        result.append(entry)
    return result


def _normalize_value_map_mappings(mappings: list | None) -> list[dict]:
    if not mappings:
        return []
    result = []
    for row in mappings:
        newvalue = (row.get("newvalue") or "").strip()
        if not newvalue:
            continue
        entry: dict = {
            "type": str(row.get("type", "0")),
            "newvalue": newvalue,
        }
        value = row.get("value")
        if value is not None and str(value).strip() != "":
            entry["value"] = str(value).strip()
        result.append(entry)
    return result


def _template_write_payload(data: dict) -> dict:
    technical = (data.get("name") or data.get("technical_name") or "").strip()
    visible = (data.get("visible_name") or technical).strip()
    groups = data.get("template_groups") or []
    linked = data.get("linked_templates") or []

    payload: dict = {
        "host": technical,
        "name": visible,
        "description": data.get("description", ""),
        "groups": [{"groupid": str(g)} for g in groups],
    }
    if linked:
        payload["templates"] = [{"templateid": str(t)} for t in linked]

    tags = _normalize_tags(data.get("tags"))
    if tags:
        payload["tags"] = tags

    macros = _normalize_macros(data.get("macros"))
    if macros:
        payload["macros"] = macros

    return payload


def _create_value_maps(zabbix, template_id: str, value_maps: list | None) -> None:
    if not value_maps:
        return
    for vm in value_maps:
        name = (vm.get("name") or "").strip()
        mappings = _normalize_value_map_mappings(vm.get("mappings"))
        if not name or not mappings:
            continue
        zabbix.valuemaps.create(
            hostid=str(template_id),
            name=name,
            mappings=mappings,
        )


class TemplateViewSet(ZabbixViewMixin, viewsets.ViewSet):
    @zabbix_action
    def list(self, request):
        zabbix = self.get_zabbix()
        params = dict(_TEMPLATE_GET_PARAMS)
        search = request.query_params.get("search")
        if search:
            params["search"] = {"name": search, "host": search}
        template_group = request.query_params.get("template_group")
        if template_group:
            params["groupids"] = [str(template_group)]
        rows = zabbix.templates.get(**params)
        return [map_template(row) for row in rows]

    @zabbix_action
    def retrieve(self, request, pk=None):
        rows = self.get_zabbix().templates.get(
            templateids=[str(pk)],
            **_TEMPLATE_GET_PARAMS,
        )
        if not rows:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return map_template(rows[0])

    @zabbix_action
    def create(self, request):
        zabbix = self.get_zabbix()
        data = request.data
        technical = (data.get("name") or data.get("technical_name") or "").strip()
        if not technical:
            return Response({"detail": "name is required."}, status=status.HTTP_400_BAD_REQUEST)
        groups = data.get("template_groups") or []
        if not groups:
            return Response(
                {"detail": "At least one template group is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        payload = _template_write_payload(data)
        host = payload.pop("host")
        groups_payload = payload.pop("groups")
        ids = zabbix.templates.create(host, groups_payload, **payload)
        template_id = ids[0]
        _create_value_maps(zabbix, template_id, data.get("value_maps"))
        return self.retrieve(request, template_id)

    @zabbix_action
    def update(self, request, pk=None):
        zabbix = self.get_zabbix()
        data = request.data
        params: dict = {}

        if "name" in data or "technical_name" in data:
            params["host"] = (data.get("name") or data.get("technical_name") or "").strip()
        if "visible_name" in data:
            params["name"] = data["visible_name"]
        elif "name" in data and "technical_name" not in data:
            params["name"] = data["name"]
        if "description" in data:
            params["description"] = data["description"]
        if "template_groups" in data:
            params["groups"] = [{"groupid": str(g)} for g in data["template_groups"]]
        if "linked_templates" in data:
            params["templates"] = [{"templateid": str(t)} for t in data["linked_templates"]]
        if "tags" in data:
            params["tags"] = _normalize_tags(data["tags"])
        if "macros" in data:
            params["macros"] = _normalize_macros(data["macros"])

        if params:
            zabbix.templates.update(str(pk), **params)

        if "value_maps" in data:
            _create_value_maps(zabbix, str(pk), data["value_maps"])

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
