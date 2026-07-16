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

    def update(self, scriptid: str, **fields: Any) -> dict:
        """
        Update an existing Zabbix Script (e.g. execute_on, command). Returns a
        dict with ``scriptids``.
        """
        return self._t.request("script.update", {"scriptid": scriptid, **fields})

    def create(
        self,
        name: str,
        command: str,
        *,
        execute_on: int = 1,
        scope: int = 2,
        host_groups: list[str] | None = None,
        description: str = "",
    ) -> dict:
        """
        Register a new Zabbix Script. Returns a dict with ``scriptids``.

        Parameters
        ----------
        execute_on : int
            Where the command runs — 0: Zabbix agent (on the target host
            itself), 1: Zabbix server, 2: Zabbix server (proxy) if the host
            has one, else the server.
        scope : int
            1: Action operation, 2: Manual host action (required for
            ``script.execute``), 4: Manual event action.
        host_groups : list[str] | None
            Host group IDs this script is selectable for.
        """
        params: dict = {
            "name": name,
            "command": command,
            "type": 0,
            "execute_on": execute_on,
            "scope": scope,
            "description": description,
        }
        if host_groups:
            params["groups"] = [{"groupid": gid} for gid in host_groups]
        return self._t.request("script.create", params)
