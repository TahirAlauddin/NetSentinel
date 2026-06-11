"""Zabbix ``proxy.*`` API methods."""

from typing import Any

from .transport import ZabbixTransport


class ProxyAPI:
    def __init__(self, transport: ZabbixTransport) -> None:
        self._t = transport

    def get(self, **params: Any) -> list[dict]:
        return self._t.request("proxy.get", params)

    def create(self, name: str, **params: Any) -> list[str]:
        result = self._t.request("proxy.create", {"name": name, **params})
        return result.get("proxyids", [])

    def update(self, proxyid: str, **params: Any) -> list[str]:
        result = self._t.request("proxy.update", {"proxyid": proxyid, **params})
        return result.get("proxyids", [])

    def delete(self, *proxyids: str) -> list[str]:
        result = self._t.request("proxy.delete", list(proxyids))
        return result.get("proxyids", [])
