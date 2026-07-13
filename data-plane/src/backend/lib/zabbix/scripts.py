"""
Wrapper for the Zabbix ``script.*`` API methods.

Scripts are user-defined actions (typically run against a host's Zabbix agent)
that can be triggered manually or from an Action. Used by the incident response
agent (remediation app) to execute remediation scripts via ``script.execute``.

Reference: https://www.zabbix.com/documentation/current/en/manual/api/reference/script
"""

from typing import Any

from .transport import ZabbixTransport


class ScriptAPI:
    """
    Provides access to Zabbix scripts (remediation actions runnable against a host).

    Obtained via ``ZabbixClient.scripts``.
    """

    def __init__(self, transport: ZabbixTransport) -> None:
        self._t = transport

    def get(self, **params: Any) -> list[dict]:
        """
        Retrieve scripts.

        Common parameters
        ------------------
        output : list[str] | "extend"
            Fields to return.
        scriptids : list[str]
            Filter by script IDs.
        hostids : list[str]
            Return only scripts available for the given hosts.
        """
        return self._t.request("script.get", params)

    def execute(self, scriptid: str, hostid: str) -> dict:
        """
        Execute a script against a host. Returns a dict with ``response`` and
        ``value`` (the script's output).
        """
        return self._t.request("script.execute", {"scriptid": scriptid, "hostid": hostid})
