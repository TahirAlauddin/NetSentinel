"""Shared Zabbix client for the monitoring app."""

from django.conf import settings

from lib.zabbix import ZabbixClient
from lib.zabbix.exceptions import ZabbixNotAuthenticatedError


class ZabbixNotConfiguredError(RuntimeError):
    """Raised when ZABBIX_URL or ZABBIX_TOKEN is missing."""


_client: ZabbixClient | None = None


def get_zabbix_client() -> ZabbixClient:
    global _client
    if _client is not None:
        return _client

    url = getattr(settings, "ZABBIX_URL", "") or ""
    token = getattr(settings, "ZABBIX_TOKEN", "") or ""
    if not url or not token:
        raise ZabbixNotConfiguredError(
            "Zabbix is not configured. Set ZABBIX_URL and ZABBIX_TOKEN in the environment."
        )

    _client = ZabbixClient(
        url=url,
        token=token,
        ssl_verify=getattr(settings, "ZABBIX_SSL_VERIFY", True),
    )
    if not _client.is_authenticated:
        raise ZabbixNotAuthenticatedError("Zabbix API token was not applied.")
    return _client


def reset_zabbix_client() -> None:
    """Clear cached client (useful in tests)."""
    global _client
    _client = None
