"""
Wrapper for the Zabbix ``history.*`` API methods.

Reference: https://www.zabbix.com/documentation/current/en/manual/api/reference/history
"""

from typing import Any

from .transport import ZabbixTransport

# History type constants — match the item value_type field
HISTORY_FLOAT = 0
HISTORY_CHARACTER = 1
HISTORY_LOG = 2
HISTORY_UNSIGNED_INT = 3
HISTORY_TEXT = 4


class HistoryAPI:
    """
    Provides access to Zabbix history data (collected item values).

    Obtained via ``ZabbixClient.history``.

    Note: History data is read-only via the API.
    """

    def __init__(self, transport: ZabbixTransport) -> None:
        self._t = transport

    def get(self, history_type: int = HISTORY_UNSIGNED_INT, **params: Any) -> list[dict]:
        """
        Retrieve historical values for items.

        Parameters
        ----------
        history_type:
            Type of history to retrieve.  Must match the ``value_type``
            of the requested items.  Use the module-level ``HISTORY_*``
            constants:

            - ``HISTORY_FLOAT`` (0) — float / numeric values
            - ``HISTORY_CHARACTER`` (1) — short strings (≤255 chars)
            - ``HISTORY_LOG`` (2) — log entries
            - ``HISTORY_UNSIGNED_INT`` (3) — unsigned integers (default)
            - ``HISTORY_TEXT`` (4) — long text values

        Common keyword parameters
        -------------------------
        output : list[str] | "extend"
            Fields to return.  History objects have: ``itemid``,
            ``clock`` (Unix timestamp), ``ns`` (nanoseconds), ``value``,
            and (for log type) ``logeventid``, ``severity``, ``source``,
            ``timestamp``.
        itemids : list[str]
            Return history for the given item IDs.
        hostids : list[str]
            Return history for items belonging to the given hosts.
        time_from : int
            Return values collected after this Unix timestamp.
        time_till : int
            Return values collected before this Unix timestamp.
        limit : int
            Maximum number of records to return.  Large limits can be
            slow — prefer a narrow time range instead.
        sortfield : str | list[str]
            Supported: ``"itemid"``, ``"clock"``.
        sortorder : "ASC" | "DESC"

        Returns
        -------
        list[dict]
            History value objects.

        Example
        -------
        ::

            from lib.zabbix import ZabbixClient
            from lib.zabbix.history import HISTORY_FLOAT
            import time

            client = ZabbixClient(url="...", token="...")
            values = client.history.get(
                history_type=HISTORY_FLOAT,
                itemids=["12345"],
                time_from=int(time.time()) - 3600,
                sortfield="clock",
                sortorder="DESC",
                limit=100,
            )
        """
        return self._t.request("history.get", {"history": history_type, **params})
