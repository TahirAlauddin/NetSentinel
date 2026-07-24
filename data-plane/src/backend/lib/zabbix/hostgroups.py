"""
Wrapper for the Zabbix ``hostgroup.*`` API methods.

Reference: https://www.zabbix.com/documentation/current/en/manual/api/reference/hostgroup
"""

from typing import Any

from .transport import ZabbixTransport


class HostGroupAPI:
    """
    Provides access to Zabbix host-group management methods.

    Obtained via ``ZabbixClient.hostgroups``.
    """

    def __init__(self, transport: ZabbixTransport) -> None:
        self._t = transport

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    def get(self, **params: Any) -> list[dict]:
        """
        Retrieve host groups matching the given criteria.

        Common parameters
        -----------------
        output : list[str] | "extend"
            Fields to return.
        groupids : list[str]
            Filter by group IDs.
        hostids : list[str]
            Return groups that contain the given hosts.
        filter : dict
            Exact-match filter, e.g. ``{"name": ["Linux servers"]}``.
        search : dict
            Partial-match filter, e.g. ``{"name": "linux"}``.
        selectHosts : list[str] | "extend"
            Include host objects belonging to each group.
        monitored_hosts : int
            ``1`` — return only groups that have at least one monitored host.
        real_hosts : int
            ``1`` — return only groups that contain real hosts (not templates).
        with_items : int
            ``1`` — return only groups that have enabled items on their hosts.
        with_triggers : int
            ``1`` — return only groups that have enabled triggers.
        limit : int
        sortfield : str | list[str]
        sortorder : "ASC" | "DESC"

        Returns
        -------
        list[dict]
        """
        return self._t.request("hostgroup.get", params)

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    def create(self, name: str, **params: Any) -> list[str]:
        """
        Create a host group.

        Parameters
        ----------
        name:
            Unique name for the host group.
        **params:
            Any additional ``hostgroup.create`` parameters.

        Returns
        -------
        list[str]
            IDs of the created groups (``groupids``).
        """
        result = self._t.request("hostgroup.create", {"name": name, **params})
        return result.get("groupids", [])

    def create_many(self, groups: list[dict]) -> list[str]:
        """
        Create multiple host groups in a single API call.

        Each dict must contain at minimum ``{"name": "..."}`.

        Returns
        -------
        list[str]
            IDs of the created groups.
        """
        result = self._t.request("hostgroup.create", groups)
        return result.get("groupids", [])

    def update(self, groupid: str, name: str, **params: Any) -> list[str]:
        """
        Rename a host group.

        Parameters
        ----------
        groupid:
            ID of the group to update.
        name:
            New name for the group.
        **params:
            Any additional fields.

        Returns
        -------
        list[str]
            IDs of the updated groups.
        """
        result = self._t.request("hostgroup.update", {"groupid": groupid, "name": name, **params})
        return result.get("groupids", [])

    def delete(self, *groupids: str) -> list[str]:
        """
        Delete one or more host groups.

        Hosts that belong *only* to the deleted group(s) will also be deleted
        by Zabbix.  Verify host memberships before calling this.

        Returns
        -------
        list[str]
            IDs of the deleted groups.
        """
        result = self._t.request("hostgroup.delete", list(groupids))
        return result.get("groupids", [])
