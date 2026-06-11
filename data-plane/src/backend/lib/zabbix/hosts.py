"""
Wrapper for the Zabbix ``host.*`` API methods.

Reference: https://www.zabbix.com/documentation/current/en/manual/api/reference/host
"""

from typing import Any, Optional

from .transport import ZabbixTransport


class HostAPI:
    """
    Provides access to Zabbix host management methods.

    Obtained via ``ZabbixClient.hosts``.
    """

    def __init__(self, transport: ZabbixTransport) -> None:
        self._t = transport

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    def get(self, **params: Any) -> list[dict]:
        """
        Retrieve hosts matching the given filter criteria.

        Common parameters
        -----------------
        output : list[str] | "extend"
            Fields to return.  ``"extend"`` returns all fields.
        hostids : list[str]
            Return only hosts with the given IDs.
        groupids : list[str]
            Return only hosts belonging to the given host groups.
        templateids : list[str]
            Return only hosts linked to the given templates.
        filter : dict
            Exact-match filter, e.g. ``{"host": ["Zabbix server"]}``.
        search : dict
            Partial-match filter, e.g. ``{"host": "linux"}``.
        selectInterfaces : list[str] | "extend"
            Include interface objects in the response.
        selectGroups : list[str] | "extend"
            Include host-group objects in the response.
        selectTags : list[str] | "extend"
            Include tag objects in the response.
        selectInventory : list[str] | "extend"
            Include inventory fields in the response.
        monitored_hosts : int
            ``1`` — return only monitored hosts.
        limit : int
            Maximum number of objects to return.
        sortfield : str | list[str]
            Fields to sort by (e.g. ``"host"`` or ``["host", "hostid"]``).
        sortorder : "ASC" | "DESC"

        Returns
        -------
        list[dict]
            Host objects returned by Zabbix.
        """
        return self._t.request("host.get", params)

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    def create(
        self,
        host: str,
        groups: list[dict],
        interfaces: Optional[list[dict]] = None,
        **params: Any,
    ) -> list[str]:
        """
        Create one or more hosts.

        Parameters
        ----------
        host:
            Technical host name (unique).
        groups:
            List of host-group objects the host belongs to,
            e.g. ``[{"groupid": "2"}]``.
        interfaces:
            List of host interface objects.  At least one interface is
            typically required.  Example for a Zabbix agent::

                [{"type": 1, "main": 1, "useip": 1,
                  "ip": "192.168.1.10", "dns": "", "port": "10050"}]

            Pass ``None`` or omit to create a host with no interfaces
            (e.g. a template-linked SNMP host where the interface is on
            the template).
        **params:
            Any additional ``host.create`` parameters such as ``name``
            (visible name), ``status`` (``0`` = monitored, ``1`` = not
            monitored), ``description``, ``inventory_mode``, ``tags``, etc.

        Returns
        -------
        list[str]
            IDs of the created hosts (``hostids``).
        """
        payload: dict[str, Any] = {"host": host, "groups": groups, **params}
        if interfaces is not None:
            payload["interfaces"] = interfaces
        result = self._t.request("host.create", payload)
        return result.get("hostids", [])

    def update(self, hostid: str, **params: Any) -> list[str]:
        """
        Update an existing host.

        Parameters
        ----------
        hostid:
            ID of the host to update.
        **params:
            Fields to change — any writable ``host`` object field, e.g.
            ``status``, ``name``, ``description``, ``groups``, ``tags``.

        Returns
        -------
        list[str]
            IDs of the updated hosts.
        """
        result = self._t.request("host.update", {"hostid": hostid, **params})
        return result.get("hostids", [])

    def delete(self, *hostids: str) -> list[str]:
        """
        Delete one or more hosts.

        Parameters
        ----------
        *hostids:
            One or more host IDs to delete.  Accepts both individual
            strings and an unpacked list::

                client.hosts.delete("10084")
                client.hosts.delete("10084", "10085")
                client.hosts.delete(*my_ids)

        Returns
        -------
        list[str]
            IDs of the deleted hosts.
        """
        ids = list(hostids)
        result = self._t.request("host.delete", ids)
        return result.get("hostids", [])

    # ------------------------------------------------------------------
    # Bulk operations
    # ------------------------------------------------------------------

    def mass_add(self, **params: Any) -> dict:
        """
        Add objects (templates, groups, macros, etc.) to multiple hosts at once.

        Common parameters
        -----------------
        hosts : list[dict]
            Hosts to update, e.g. ``[{"hostid": "10084"}]``.
        groups : list[dict]
            Host groups to add, e.g. ``[{"groupid": "4"}]``.
        templates : list[dict]
            Templates to link, e.g. ``[{"templateid": "10050"}]``.
        macros : list[dict]
            User macros to add.
        interfaces : list[dict]
            Interfaces to add.

        Returns
        -------
        dict
            Contains ``hostids`` — IDs of the affected hosts.
        """
        return self._t.request("host.massadd", params)

    def mass_update(self, **params: Any) -> dict:
        """
        Update common properties on multiple hosts simultaneously.

        Common parameters
        -----------------
        hosts : list[dict]
            Hosts to update.
        status : int
            New monitoring status (``0`` = monitored, ``1`` = not monitored).
        groups : list[dict]
            Replace all host-group memberships with the given groups.
        templates : list[dict]
            Replace all linked templates with the given templates.

        Returns
        -------
        dict
            Contains ``hostids``.
        """
        return self._t.request("host.massupdate", params)

    def mass_remove(self, **params: Any) -> dict:
        """
        Remove objects (templates, groups, macros) from multiple hosts.

        Common parameters
        -----------------
        hostids : list[str]
            IDs of the hosts to update.
        groupids : list[str]
            IDs of host groups to remove.
        templateids : list[str]
            IDs of templates to unlink.
        templateids_clear : list[str]
            IDs of templates to unlink and clear items/triggers from.

        Returns
        -------
        dict
            Contains ``hostids``.
        """
        return self._t.request("host.massremove", params)
