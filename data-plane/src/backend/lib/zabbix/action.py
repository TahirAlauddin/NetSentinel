"""Zabbix ``action.*`` API methods."""

from typing import Any

from .transport import ZabbixTransport


class ActionAPI:
    def __init__(self, transport: ZabbixTransport) -> None:
        self._t = transport

    def get(self, **params: Any) -> list[dict]:
        return self._t.request("action.get", params)

    def create(self, name: str, eventsource: int, status: int, **params: Any) -> list[str]:
        payload: dict[str, Any] = {
            "name": name,
            "eventsource": eventsource,
            "status": status,
            **params,
        }
        result = self._t.request("action.create", payload)
        return result.get("actionids", [])

    def update(self, actionid: str, **params: Any) -> list[str]:
        result = self._t.request("action.update", {"actionid": actionid, **params})
        return result.get("actionids", [])

    def delete(self, *actionids: str) -> list[str]:
        result = self._t.request("action.delete", list(actionids))
        return result.get("actionids", [])
