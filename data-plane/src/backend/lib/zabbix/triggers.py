"""
Wrapper for the Zabbix ``trigger.*`` API methods.

Reference: https://www.zabbix.com/documentation/current/en/manual/api/reference/trigger
"""

from typing import Any

from .transport import ZabbixTransport

# Trigger severity constants
SEVERITY_NOT_CLASSIFIED = 0
SEVERITY_INFORMATION = 1
SEVERITY_WARNING = 2
SEVERITY_AVERAGE = 3
SEVERITY_HIGH = 4
SEVERITY_DISASTER = 5

# Trigger status
STATUS_ENABLED = 0
STATUS_DISABLED = 1


class TriggerAPI:
    """
    Provides access to Zabbix trigger management methods.

    Obtained via ``ZabbixClient.triggers``.
    """

    def __init__(self, transport: ZabbixTransport) -> None:
        self._t = transport

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    def get(self, **params: Any) -> list[dict]:
        """
        Retrieve triggers matching the given criteria.

        Common parameters
        -----------------
        output : list[str] | "extend"
            Fields to return.
        triggerids : list[str]
            Filter by trigger IDs.
        hostids : list[str]
            Return triggers belonging to the given hosts.
        groupids : list[str]
            Return triggers belonging to hosts in the given groups.
        templateids : list[str]
            Return triggers belonging to the given templates.
        filter : dict
            Exact-match filter, e.g. ``{"status": [0]}``.
        search : dict
            Partial-match filter, e.g. ``{"description": "cpu"}``.
        active : int
            ``1`` — return only triggers for monitored hosts.
        only_true : int
            ``1`` — return only triggers that are in problem state.
        min_severity : int
            Minimum severity to return (use ``SEVERITY_*`` constants).
        selectHosts : list[str] | "extend"
            Include host objects.
        selectItems : list[str] | "extend"
            Include item objects used in the trigger expression.
        selectTags : list[str] | "extend"
            Include tag objects.
        withUnacknowledgedEvents : int
            ``1`` — return only triggers with unacknowledged events.
        limit : int
        sortfield : str | list[str]
        sortorder : "ASC" | "DESC"

        Returns
        -------
        list[dict]
        """
        return self._t.request("trigger.get", params)

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    def create(self, description: str, expression: str, **params: Any) -> list[str]:
        """
        Create a trigger.

        Parameters
        ----------
        description:
            Trigger name.
        expression:
            Trigger expression using Zabbix expression syntax, e.g.
            ``"last(/Linux server/system.cpu.load[percpu,avg1])>5"``.
        **params:
            Optional fields: ``priority`` (severity), ``status``,
            ``comments``, ``url``, ``recovery_mode``,
            ``recovery_expression``, ``correlation_mode``,
            ``correlation_tag``, ``tags``, ``dependencies``.

        Returns
        -------
        list[str]
            IDs of the created triggers (``triggerids``).
        """
        payload: dict[str, Any] = {
            "description": description,
            "expression": expression,
            **params,
        }
        result = self._t.request("trigger.create", payload)
        return result.get("triggerids", [])

    def create_many(self, triggers: list[dict]) -> list[str]:
        """
        Create multiple triggers in a single API call.

        Each dict must contain at minimum ``description`` and ``expression``.

        Returns
        -------
        list[str]
            IDs of the created triggers.
        """
        result = self._t.request("trigger.create", triggers)
        return result.get("triggerids", [])

    def update(self, triggerid: str, **params: Any) -> list[str]:
        """
        Update an existing trigger.

        Parameters
        ----------
        triggerid:
            ID of the trigger to update.
        **params:
            Fields to change, e.g. ``status=0`` to enable,
            ``priority=4`` to set severity to *High*.

        Returns
        -------
        list[str]
            IDs of the updated triggers.
        """
        result = self._t.request("trigger.update", {"triggerid": triggerid, **params})
        return result.get("triggerids", [])

    def update_many(self, triggers: list[dict]) -> list[str]:
        """
        Update multiple triggers in a single API call.

        Each dict must contain ``triggerid`` plus the fields to change.

        Returns
        -------
        list[str]
            IDs of the updated triggers.
        """
        result = self._t.request("trigger.update", triggers)
        return result.get("triggerids", [])

    def delete(self, *triggerids: str) -> list[str]:
        """
        Delete one or more triggers.

        Returns
        -------
        list[str]
            IDs of the deleted triggers.
        """
        result = self._t.request("trigger.delete", list(triggerids))
        return result.get("triggerids", [])
