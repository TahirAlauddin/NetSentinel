"""
Wrapper for the Zabbix ``item.*`` API methods.

Reference: https://www.zabbix.com/documentation/current/en/manual/api/reference/item
"""

from typing import Any

from .transport import ZabbixTransport

# Zabbix item type constants (item.type field)
ITEM_TYPE_ZABBIX_AGENT = 0
ITEM_TYPE_SNMP = 20
ITEM_TYPE_ZABBIX_TRAPPER = 2
ITEM_TYPE_SIMPLE_CHECK = 3
ITEM_TYPE_INTERNAL = 5
ITEM_TYPE_EXTERNAL = 10
ITEM_TYPE_CALCULATED = 15
ITEM_TYPE_HTTP_AGENT = 19

# Zabbix value type constants (item.value_type field)
VALUE_TYPE_FLOAT = 0
VALUE_TYPE_CHARACTER = 1
VALUE_TYPE_LOG = 2
VALUE_TYPE_UNSIGNED_INT = 3
VALUE_TYPE_TEXT = 4


class ItemAPI:
    """
    Provides access to Zabbix item management methods.

    Obtained via ``ZabbixClient.items``.
    """

    def __init__(self, transport: ZabbixTransport) -> None:
        self._t = transport

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    def get(self, **params: Any) -> list[dict]:
        """
        Retrieve items matching the given criteria.

        Common parameters
        -----------------
        output : list[str] | "extend"
            Fields to return.
        itemids : list[str]
            Filter by item IDs.
        hostids : list[str]
            Return items belonging to the given hosts.
        groupids : list[str]
            Return items belonging to hosts in the given groups.
        templateids : list[str]
            Return items belonging to the given templates.
        filter : dict
            Exact-match filter, e.g. ``{"key_": ["system.uptime"]}``.
        search : dict
            Partial-match filter, e.g. ``{"name": "cpu"}``.
        selectHosts : list[str] | "extend"
            Include host objects in the response.
        monitored : int
            ``1`` — return only monitored items.
        inherited : int
            ``1`` — return only inherited items.
        limit : int
            Maximum number of objects to return.
        sortfield : str | list[str]
        sortorder : "ASC" | "DESC"

        Returns
        -------
        list[dict]
        """
        return self._t.request("item.get", params)

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    def create(
        self,
        name: str,
        key_: str,
        hostid: str,
        type: int,
        value_type: int,
        **params: Any,
    ) -> list[str]:
        """
        Create one or more items.

        Parameters
        ----------
        name:
            Visible item name.
        key_:
            Item key, e.g. ``"system.uptime"`` or
            ``"vfs.fs.size[/,free]"``.
        hostid:
            ID of the host (or template) to add the item to.
        type:
            Item type constant.  Use the module-level ``ITEM_TYPE_*``
            constants or an integer directly.  ``0`` = Zabbix agent.
        value_type:
            Type of the collected value.  Use ``VALUE_TYPE_*`` constants.
            ``3`` = unsigned integer, ``0`` = float.
        **params:
            Additional item fields such as ``interfaceid``, ``delay``,
            ``units``, ``history``, ``trends``, ``description``,
            ``tags``, ``preprocessing``.

        Returns
        -------
        list[str]
            IDs of the created items (``itemids``).
        """
        payload: dict[str, Any] = {
            "name": name,
            "key_": key_,
            "hostid": hostid,
            "type": type,
            "value_type": value_type,
            **params,
        }
        result = self._t.request("item.create", payload)
        return result.get("itemids", [])

    def create_many(self, items: list[dict]) -> list[str]:
        """
        Create multiple items in a single API call.

        Parameters
        ----------
        items:
            List of item objects.  Each must contain at minimum:
            ``name``, ``key_``, ``hostid``, ``type``, ``value_type``.

        Returns
        -------
        list[str]
            IDs of the created items.
        """
        result = self._t.request("item.create", items)
        return result.get("itemids", [])

    def update(self, itemid: str, **params: Any) -> list[str]:
        """
        Update an existing item.

        Parameters
        ----------
        itemid:
            ID of the item to update.
        **params:
            Fields to change, e.g. ``status=0`` to enable,
            ``delay="60"`` to change the polling interval.

        Returns
        -------
        list[str]
            IDs of the updated items.
        """
        result = self._t.request("item.update", {"itemid": itemid, **params})
        return result.get("itemids", [])

    def update_many(self, items: list[dict]) -> list[str]:
        """
        Update multiple items in a single API call.

        Each dict in *items* must contain ``itemid`` plus the fields to change.

        Returns
        -------
        list[str]
            IDs of the updated items.
        """
        result = self._t.request("item.update", items)
        return result.get("itemids", [])

    def delete(self, *itemids: str) -> list[str]:
        """
        Delete one or more items.

        Parameters
        ----------
        *itemids:
            Item IDs to delete.

        Returns
        -------
        list[str]
            IDs of the deleted items.
        """
        result = self._t.request("item.delete", list(itemids))
        return result.get("itemids", [])
