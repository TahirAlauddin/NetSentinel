"""
Wrapper for the Zabbix ``templategroup.*`` API methods.

Reference: https://www.zabbix.com/documentation/current/en/manual/api/reference/templategroup
"""

from typing import Any

from .transport import ZabbixTransport


class TemplateGroupAPI:
    """Provides access to Zabbix template-group management methods."""

    def __init__(self, transport: ZabbixTransport) -> None:
        self._t = transport

    def get(self, **params: Any) -> list[dict]:
        return self._t.request("templategroup.get", params)

    def create(self, name: str, **params: Any) -> list[str]:
        result = self._t.request("templategroup.create", {"name": name, **params})
        return result.get("groupids", [])

    def update(self, groupid: str, name: str, **params: Any) -> list[str]:
        result = self._t.request(
            "templategroup.update", {"groupid": groupid, "name": name, **params}
        )
        return result.get("groupids", [])

    def delete(self, *groupids: str) -> list[str]:
        result = self._t.request("templategroup.delete", list(groupids))
        return result.get("groupids", [])
