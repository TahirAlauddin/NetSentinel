"""
NetSentinel Zabbix API client library.

Supports Zabbix 8.0+ using JSON-RPC 2.0 over HTTP/HTTPS.

Quick start
-----------
Token authentication::

    from lib.zabbix import ZabbixClient

    client = ZabbixClient(url="https://zabbix.example.com", token="mytoken")
    print(client.apiinfo.version())

Username / password authentication::

    from lib.zabbix import ZabbixClient

    with ZabbixClient(url="https://zabbix.example.com",
                      username="Admin", password="zabbix") as zabbix:
        hosts = zabbix.hosts.get(output=["hostid", "host"], limit=50)

Error handling::

    from lib.zabbix import ZabbixClient, ZabbixAPIError, ZabbixConnectionError

    try:
        client.hosts.create(host="bad-host", groups=[])
    except ZabbixAPIError as e:
        print(f"API rejected request: {e.message} — {e.data}")
    except ZabbixConnectionError as e:
        print(f"Could not reach Zabbix: {e}")
"""

from .client import ZabbixClient
from .exceptions import (
    ZabbixAPIError,
    ZabbixAuthError,
    ZabbixConnectionError,
    ZabbixError,
    ZabbixNotAuthenticatedError,
)

__all__ = [
    "ZabbixClient",
    "ZabbixError",
    "ZabbixAPIError",
    "ZabbixAuthError",
    "ZabbixConnectionError",
    "ZabbixNotAuthenticatedError",
]
