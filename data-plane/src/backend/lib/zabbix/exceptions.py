"""
Exceptions raised by the Zabbix API client library.
"""


class ZabbixError(Exception):
    """Base class for all Zabbix library exceptions."""


class ZabbixAPIError(ZabbixError):
    """
    Raised when the Zabbix API returns an error object in its JSON-RPC response.

    Attributes:
        code:    JSON-RPC / Zabbix error code (e.g. -32602 for invalid params).
        message: Short error summary returned by Zabbix.
        data:    Detailed error description returned by Zabbix (may be empty).
    """

    def __init__(self, code: int, message: str, data: str = "") -> None:
        self.code = code
        self.message = message
        self.data = data
        detail = f": {data}" if data else ""
        super().__init__(f"[{code}] {message}{detail}")


class ZabbixAuthError(ZabbixError):
    """
    Raised when authentication fails (wrong credentials, session expired, etc.).
    This is a semantic wrapper around ZabbixAPIError for auth-specific failures
    so callers can catch it without inspecting error codes.
    """


class ZabbixConnectionError(ZabbixError):
    """
    Raised when the HTTP transport layer fails — network errors, DNS failures,
    connection timeouts, non-2xx HTTP responses, or unparseable JSON replies.
    """


class ZabbixNotAuthenticatedError(ZabbixError):
    """
    Raised when an API method that requires authentication is called before
    a token has been set (either via login() or by passing a token at
    construction time).
    """
