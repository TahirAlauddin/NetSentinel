"""Zabbix ``maintenance.*`` API methods."""

from typing import Any

from .transport import ZabbixTransport


class MaintenanceAPI:
    def __init__(self, transport: ZabbixTransport) -> None:
        self._t = transport

    def get(self, **params: Any) -> list[dict]:
        return self._t.request("maintenance.get", params)

    def create(self, name: str, **params: Any) -> list[str]:
        result = self._t.request("maintenance.create", {"name": name, **params})
        return result.get("maintenanceids", [])

    def update(self, maintenanceid: str, **params: Any) -> list[str]:
        result = self._t.request("maintenance.update", {"maintenanceid": maintenanceid, **params})
        return result.get("maintenanceids", [])

    def delete(self, *maintenanceids: str) -> list[str]:
        result = self._t.request("maintenance.delete", list(maintenanceids))
        return result.get("maintenanceids", [])
