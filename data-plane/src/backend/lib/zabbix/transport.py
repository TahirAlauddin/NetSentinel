"""
Low-level HTTP transport for the Zabbix JSON-RPC 2.0 API.

Responsibilities
----------------
- Build and send JSON-RPC requests.
- Manage the Bearer token (set, clear, forward via Authorization header).
- Parse responses and raise typed exceptions on errors.
- Provide thread-safe request-ID generation.
"""

import threading
from typing import Any, Optional

import requests

from .exceptions import (
    ZabbixAPIError,
    ZabbixConnectionError,
    ZabbixNotAuthenticatedError,
)

_JSONRPC_VERSION = "2.0"
_CONTENT_TYPE = "application/json-rpc"


class ZabbixTransport:
    """
    Thin HTTP wrapper around Zabbix's JSON-RPC endpoint.

    All API classes receive a shared instance of this transport so that
    authentication state (the Bearer token) is centralised.

    Parameters
    ----------
    url:
        Base URL of the Zabbix frontend, e.g. ``https://zabbix.example.com``.
        The ``/api_jsonrpc.php`` suffix is appended automatically.
    timeout:
        Number of seconds to wait for a response before raising
        :class:`~.exceptions.ZabbixConnectionError`.  Defaults to 30.
    ssl_verify:
        Whether to verify TLS certificates.  Set to ``False`` only for
        self-signed certs in controlled environments.
    session:
        An existing :class:`requests.Session` to reuse.  A new session is
        created when omitted.
    """

    DEFAULT_TIMEOUT: int = 30

    def __init__(
        self,
        url: str,
        timeout: int = DEFAULT_TIMEOUT,
        ssl_verify: bool = True,
        session: Optional[requests.Session] = None,
    ) -> None:
        self._endpoint = url.rstrip("/") + "/api_jsonrpc.php"
        self._timeout = timeout
        self._ssl_verify = ssl_verify

        self._session = session or requests.Session()
        self._session.headers.update({"Content-Type": _CONTENT_TYPE})

        self._auth_token: Optional[str] = None
        self._request_id: int = 0
        self._id_lock = threading.Lock()

    # ------------------------------------------------------------------
    # Token management
    # ------------------------------------------------------------------

    def set_token(self, token: str) -> None:
        """Store *token* and attach it as a Bearer Authorization header."""
        self._auth_token = token
        self._session.headers["Authorization"] = f"Bearer {token}"

    def clear_token(self) -> None:
        """Remove the stored token and its Authorization header."""
        self._auth_token = None
        self._session.headers.pop("Authorization", None)

    @property
    def is_authenticated(self) -> bool:
        """``True`` when a token is currently set."""
        return self._auth_token is not None

    @property
    def token(self) -> Optional[str]:
        """The raw token string, or ``None`` if not authenticated."""
        return self._auth_token

    # ------------------------------------------------------------------
    # Core request method
    # ------------------------------------------------------------------

    def request(
        self,
        method: str,
        params: Optional[dict] = None,
        require_auth: bool = True,
    ) -> Any:
        """
        Send a JSON-RPC request and return the ``result`` field.

        Parameters
        ----------
        method:
            Zabbix API method name, e.g. ``"host.get"``.
        params:
            Dictionary of method parameters.  Defaults to ``{}``.
        require_auth:
            When ``True`` (default) an exception is raised immediately if no
            token is set, before any HTTP request is made.  Pass ``False``
            only for ``user.login`` and ``apiinfo.version``.

        Returns
        -------
        Any
            The ``result`` value from the JSON-RPC response — typically a
            list, dict, or scalar string depending on the called method.

        Raises
        ------
        ZabbixNotAuthenticatedError
            If *require_auth* is ``True`` and no token has been set.
        ZabbixConnectionError
            On any network / HTTP / JSON-parsing failure.
        ZabbixAPIError
            When Zabbix returns an ``error`` object in the response body.
        """
        if require_auth and not self.is_authenticated:
            raise ZabbixNotAuthenticatedError(
                f"Not authenticated. Call ZabbixClient.login() or supply an API "
                f"token before calling '{method}'."
            )

        payload = {
            "jsonrpc": _JSONRPC_VERSION,
            "method": method,
            "params": params if params is not None else {},
            "id": self._next_id(),
        }

        # apiinfo.version and user.login reject requests that carry Authorization.
        saved_auth: Optional[str] = None
        if not require_auth:
            saved_auth = self._session.headers.pop("Authorization", None)

        try:
            response = self._session.post(
                self._endpoint,
                json=payload,
                timeout=self._timeout,
                verify=self._ssl_verify,
            )
            response.raise_for_status()
        except requests.exceptions.ConnectionError as exc:
            raise ZabbixConnectionError(
                f"Cannot connect to Zabbix at '{self._endpoint}': {exc}"
            ) from exc
        except requests.exceptions.Timeout as exc:
            raise ZabbixConnectionError(
                f"Request to '{method}' timed out after {self._timeout}s."
            ) from exc
        except requests.exceptions.HTTPError as exc:
            raise ZabbixConnectionError(
                f"Zabbix returned HTTP {exc.response.status_code} for '{method}'."
            ) from exc
        except requests.exceptions.RequestException as exc:
            raise ZabbixConnectionError(
                f"Unexpected request error for '{method}': {exc}"
            ) from exc
        finally:
            if not require_auth and saved_auth is not None:
                self._session.headers["Authorization"] = saved_auth

        try:
            body = response.json()
        except ValueError as exc:
            raise ZabbixConnectionError(
                f"Zabbix returned non-JSON response for '{method}'."
            ) from exc

        if "error" in body:
            err = body["error"]
            raise ZabbixAPIError(
                code=err.get("code", -1),
                message=err.get("message", "Unknown error"),
                data=err.get("data", ""),
            )

        return body.get("result")

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _next_id(self) -> int:
        with self._id_lock:
            self._request_id += 1
            return self._request_id
