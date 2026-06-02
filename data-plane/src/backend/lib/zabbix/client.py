"""
High-level Zabbix API client.

``ZabbixClient`` is the single entry point for this library.  It wires
together the transport layer and all per-namespace API objects so callers
work with a clean, discoverable interface::

    from lib.zabbix import ZabbixClient

    # --- Token-based auth (API token created in Zabbix frontend) ---
    client = ZabbixClient(url="https://zabbix.example.com", token="abc123...")

    # --- Username / password auth ---
    client = ZabbixClient(
        url="https://zabbix.example.com",
        username="Admin",
        password="zabbix",
    )
    client.login()

    # --- Context manager (auto login / logout) ---
    with ZabbixClient(url="...", username="Admin", password="zabbix") as zabbix:
        hosts = zabbix.hosts.get(output=["hostid", "host"])
"""

from typing import Optional

import requests

from .action import ActionAPI
from .apiinfo import APIInfoAPI
from .events import EventAPI
from .exceptions import ZabbixAuthError
from .history import HistoryAPI
from .hostgroups import HostGroupAPI
from .hosts import HostAPI
from .items import ItemAPI
from .maintenance import MaintenanceAPI
from .mediatype import MediaTypeAPI
from .problems import ProblemAPI
from .proxy import ProxyAPI
from .templates import TemplateAPI
from .transport import ZabbixTransport
from .triggers import TriggerAPI
from .users import UserAPI


class ZabbixClient:
    """
    Unified client for the Zabbix JSON-RPC API (8.0+).

    Parameters
    ----------
    url:
        Base URL of the Zabbix frontend, e.g.
        ``"https://zabbix.example.com"`` or
        ``"https://zabbix.example.com/zabbix"``.
        The ``/api_jsonrpc.php`` path is appended automatically.
    token:
        A pre-existing API token (created via the Zabbix web UI or
        the Token API).  When provided, ``login()`` is not required.
        Mutually exclusive with *username* / *password* in spirit —
        you can supply both, but the token takes effect immediately.
    username:
        Zabbix username for password-based authentication.
        Call ``login()`` (or use the context manager) after construction.
    password:
        Zabbix password for password-based authentication.
    timeout:
        HTTP request timeout in seconds.  Defaults to 30.
    ssl_verify:
        Whether to verify TLS certificates.  Set to ``False`` only in
        controlled environments with self-signed certificates.
    session:
        An existing :class:`requests.Session` to reuse (e.g. for custom
        adapters or proxy configuration).

    Attributes
    ----------
    hosts : HostAPI
    items : ItemAPI
    triggers : TriggerAPI
    problems : ProblemAPI
    history : HistoryAPI
    hostgroups : HostGroupAPI
    events : EventAPI
    templates : TemplateAPI
    users : UserAPI
    apiinfo : APIInfoAPI

    Examples
    --------
    Token auth — fire and forget::

        client = ZabbixClient(url="https://zbx.example.com", token="mytoken")
        version = client.apiinfo.version()
        hosts = client.hosts.get(output="extend", limit=10)

    Password auth with explicit login / logout::

        client = ZabbixClient(url="...", username="Admin", password="zabbix")
        client.login()
        try:
            client.hosts.update("10084", status=1)
        finally:
            client.logout()

    Context manager::

        with ZabbixClient(url="...", username="Admin", password="zabbix") as zabbix:
            zabbix.triggers.update_many([
                {"triggerid": "13938", "status": 0},
                {"triggerid": "13939", "status": 0},
            ])
    """

    def __init__(
        self,
        url: str,
        token: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        timeout: int = ZabbixTransport.DEFAULT_TIMEOUT,
        ssl_verify: bool = True,
        session: Optional[requests.Session] = None,
    ) -> None:
        self._username = username
        self._password = password
        self._transport = ZabbixTransport(
            url=url,
            timeout=timeout,
            ssl_verify=ssl_verify,
            session=session,
        )

        # Initialise per-namespace API objects — all share the same transport
        self.hosts = HostAPI(self._transport)
        self.items = ItemAPI(self._transport)
        self.triggers = TriggerAPI(self._transport)
        self.problems = ProblemAPI(self._transport)
        self.history = HistoryAPI(self._transport)
        self.hostgroups = HostGroupAPI(self._transport)
        self.events = EventAPI(self._transport)
        self.templates = TemplateAPI(self._transport)
        self.users = UserAPI(self._transport)
        self.apiinfo = APIInfoAPI(self._transport)
        self.proxies = ProxyAPI(self._transport)
        self.maintenance = MaintenanceAPI(self._transport)
        self.actions = ActionAPI(self._transport)
        self.mediatypes = MediaTypeAPI(self._transport)

        if token:
            self._transport.set_token(token)

    # ------------------------------------------------------------------
    # Authentication
    # ------------------------------------------------------------------

    def login(self) -> str:
        """
        Authenticate with username and password, storing the returned token.

        Must be called before any authenticated API method when the client
        was created without a *token*.

        Returns
        -------
        str
            The session/API token returned by Zabbix.

        Raises
        ------
        ZabbixAuthError
            If no username or password was supplied at construction time.
        ZabbixAPIError
            If Zabbix rejects the credentials.
        """
        if not self._username or not self._password:
            raise ZabbixAuthError(
                "Cannot call login(): no username or password was provided. "
                "Pass username= and password= when constructing ZabbixClient."
            )
        token: str = self._transport.request(
            "user.login",
            {"username": self._username, "password": self._password},
            require_auth=False,
        )
        self._transport.set_token(token)
        return token

    def logout(self) -> None:
        """
        Invalidate the current session token on the Zabbix server.

        Silently does nothing when the client is using a permanent API token
        (those are not invalidated by ``user.logout``).  Safe to call even
        if already logged out.
        """
        if not self._transport.is_authenticated:
            return
        try:
            self._transport.request("user.logout", {})
        finally:
            self._transport.clear_token()

    # ------------------------------------------------------------------
    # Context manager support
    # ------------------------------------------------------------------

    def __enter__(self) -> "ZabbixClient":
        self.login()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        try:
            self.logout()
        except Exception:
            pass

    # ------------------------------------------------------------------
    # Convenience / introspection
    # ------------------------------------------------------------------

    @property
    def is_authenticated(self) -> bool:
        """``True`` when a token is currently held by the transport."""
        return self._transport.is_authenticated

    @property
    def token(self) -> Optional[str]:
        """The active token string, or ``None`` if not authenticated."""
        return self._transport.token

    def set_token(self, token: str) -> None:
        """
        Replace the current token with *token* (e.g. after an external refresh).

        This is useful when you manage token lifecycle outside the client
        and just want to update what the transport uses for requests.
        """
        self._transport.set_token(token)

    def __repr__(self) -> str:
        status = "authenticated" if self.is_authenticated else "unauthenticated"
        return f"<ZabbixClient url={self._transport._endpoint!r} [{status}]>"
