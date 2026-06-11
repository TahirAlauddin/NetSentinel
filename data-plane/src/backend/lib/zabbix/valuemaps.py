"""
Wrapper for the Zabbix ``valuemap.*`` API methods.

Reference: https://www.zabbix.com/documentation/current/en/manual/api/reference/valuemap
"""

from typing import Any

from .transport import ZabbixTransport


class ValueMapAPI:
    """Provides access to Zabbix value map management methods."""

    def __init__(self, transport: ZabbixTransport) -> None:
        self._t = transport

    def get(self, **params: Any) -> list[dict]:
        return self._t.request("valuemap.get", params)

    def create(self, **params: Any) -> list[str]:
        result = self._t.request("valuemap.create", params)
        return result.get("valuemapids", [])

    def update(self, valuemapid: str, **params: Any) -> list[str]:
        result = self._t.request("valuemap.update", {"valuemapid": valuemapid, **params})
        return result.get("valuemapids", [])

    def delete(self, *valuemapids: str) -> list[str]:
        result = self._t.request("valuemap.delete", list(valuemapids))
        return result.get("valuemapids", [])
