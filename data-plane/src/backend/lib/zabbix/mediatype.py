"""Zabbix ``mediatype.*`` API methods."""

from typing import Any

from .transport import ZabbixTransport


class MediaTypeAPI:
    def __init__(self, transport: ZabbixTransport) -> None:
        self._t = transport

    def get(self, **params: Any) -> list[dict]:
        return self._t.request("mediatype.get", params)

    def create(self, name: str, type: int, **params: Any) -> list[str]:
        payload: dict[str, Any] = {"name": name, "type": type, **params}
        result = self._t.request("mediatype.create", payload)
        return result.get("mediatypeids", [])

    def update(self, mediatypeid: str, **params: Any) -> list[str]:
        result = self._t.request("mediatype.update", {"mediatypeid": mediatypeid, **params})
        return result.get("mediatypeids", [])

    def delete(self, *mediatypeids: str) -> list[str]:
        result = self._t.request("mediatype.delete", list(mediatypeids))
        return result.get("mediatypeids", [])
