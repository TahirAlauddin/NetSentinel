"""
Wrapper for the Zabbix ``user.*`` API methods.

Note: login() / logout() live on ZabbixClient rather than here, because they
manage shared transport state.  This module covers user CRUD operations.

Reference: https://www.zabbix.com/documentation/current/en/manual/api/reference/user
"""

from typing import Any

from .transport import ZabbixTransport

# User type constants
USER_TYPE_REGULAR = 1
USER_TYPE_ADMIN = 2
USER_TYPE_SUPER_ADMIN = 3


class UserAPI:
    """
    Provides access to Zabbix user management methods.

    Obtained via ``ZabbixClient.users``.
    """

    def __init__(self, transport: ZabbixTransport) -> None:
        self._t = transport

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    def get(self, **params: Any) -> list[dict]:
        """
        Retrieve users matching the given criteria.

        Common parameters
        -----------------
        output : list[str] | "extend"
            Fields to return.  Passwords are never returned.
        userids : list[str]
            Filter by user IDs.
        usrgrpids : list[str]
            Return users belonging to the given user groups.
        filter : dict
            Exact-match filter, e.g. ``{"username": ["Admin"]}``.
        search : dict
            Partial-match filter, e.g. ``{"name": "john"}``.
        selectUsrgrps : list[str] | "extend"
            Include user-group objects.
        selectRole : list[str] | "extend"
            Include the user's role object.
        selectMedias : list[str] | "extend"
            Include media (notification channel) configurations.
        limit : int
        sortfield : str | list[str]
        sortorder : "ASC" | "DESC"

        Returns
        -------
        list[dict]
        """
        return self._t.request("user.get", params)

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    def create(self, **params: Any) -> list[str]:
        """
        Create a user.

        Common parameters
        -----------------
        username : str
            Login name (required).
        passwd : str
            Password (required unless using LDAP / SSO).
        usrgrps : list[dict]
            Groups the user belongs to, e.g. ``[{"usrgrpid": "7"}]``
            (required).
        roleid : str
            ID of the role to assign.
        name : str
            First name.
        surname : str
            Last name.
        lang : str
            Language code, e.g. ``"en_US"``.
        timezone : str
            Timezone string, e.g. ``"Europe/London"``.
        autologin : int
            ``1`` — enable auto-login.
        autologout : str
            Session timeout, e.g. ``"0"`` to disable, ``"1d"`` for 1 day.
        medias : list[dict]
            Media entries for notifications.

        Returns
        -------
        list[str]
            IDs of the created users (``userids``).
        """
        result = self._t.request("user.create", params)
        return result.get("userids", [])

    def update(self, userid: str, **params: Any) -> list[str]:
        """
        Update an existing user.

        Parameters
        ----------
        userid:
            ID of the user to update.
        **params:
            Fields to change.  To change the password pass ``passwd``.

        Returns
        -------
        list[str]
            IDs of the updated users.
        """
        result = self._t.request("user.update", {"userid": userid, **params})
        return result.get("userids", [])

    def delete(self, *userids: str) -> list[str]:
        """
        Delete one or more users.

        Returns
        -------
        list[str]
            IDs of the deleted users.
        """
        result = self._t.request("user.delete", list(userids))
        return result.get("userids", [])

    def update_media(self, userid: str, medias: list[dict]) -> list[str]:
        """
        Replace all media (notification channels) for a user.

        Parameters
        ----------
        userid:
            ID of the user.
        medias:
            New list of media objects.  Each must have ``mediatypeid``,
            ``sendto`` (list of addresses), ``active``, ``severity``,
            ``period``.

        Returns
        -------
        list[str]
            IDs of the updated users.
        """
        result = self._t.request("user.update", {"userid": userid, "medias": medias})
        return result.get("userids", [])
