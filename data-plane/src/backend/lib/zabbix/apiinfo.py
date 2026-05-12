"""
Wrapper for the Zabbix ``apiinfo.*`` API methods.

``apiinfo.version`` is the only unauthenticated method in the Zabbix API and
is useful for probing connectivity and checking which feature set is available.

Reference: https://www.zabbix.com/documentation/current/en/manual/api/reference/apiinfo
"""

from .transport import ZabbixTransport


class APIInfoAPI:
    """
    Provides access to API metadata methods.

    Obtained via ``ZabbixClient.apiinfo``.
    """

    def __init__(self, transport: ZabbixTransport) -> None:
        self._t = transport

    def version(self) -> str:
        """
        Return the version of the Zabbix API.

        This is the only method that does *not* require authentication and
        can therefore be called before ``ZabbixClient.login()``.

        Returns
        -------
        str
            Version string, e.g. ``"8.0.0"``.

        Example
        -------
        ::

            client = ZabbixClient(url="https://zabbix.example.com")
            print(client.apiinfo.version())  # "8.0.0"
        """
        return self._t.request("apiinfo.version", {}, require_auth=False)
