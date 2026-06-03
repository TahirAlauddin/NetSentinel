"""
Wrapper for the Zabbix ``template.*`` API methods.

Reference: https://www.zabbix.com/documentation/current/en/manual/api/reference/template
"""

from typing import Any

from .transport import ZabbixTransport


class TemplateAPI:
    """
    Provides access to Zabbix template management methods.

    Obtained via ``ZabbixClient.templates``.
    """

    def __init__(self, transport: ZabbixTransport) -> None:
        self._t = transport

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    def get(self, **params: Any) -> list[dict]:
        """
        Retrieve templates matching the given criteria.

        Common parameters
        -----------------
        output : list[str] | "extend"
            Fields to return.
        templateids : list[str]
            Filter by template IDs.
        groupids : list[str]
            Return templates belonging to the given groups.
        hostids : list[str]
            Return templates linked to the given hosts.
        parentTemplateids : list[str]
            Return templates that are children of the given parent templates.
        filter : dict
            Exact-match filter, e.g. ``{"host": ["Linux by Zabbix agent"]}``.
        search : dict
            Partial-match filter, e.g. ``{"name": "linux"}``.
        selectHosts : list[str] | "extend"
            Include host objects linked to each template.
        selectItems : list[str] | "extend"
            Include item objects.
        selectTriggers : list[str] | "extend"
            Include trigger objects.
        selectGroups : list[str] | "extend"
            Include group objects.
        selectParentTemplates : list[str] | "extend"
            Include parent template objects.
        selectTags : list[str] | "extend"
            Include tag objects.
        limit : int
        sortfield : str | list[str]
        sortorder : "ASC" | "DESC"

        Returns
        -------
        list[dict]
        """
        return self._t.request("template.get", params)

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    def create(self, host: str, groups: list[dict], **params: Any) -> list[str]:
        """
        Create a template.

        Parameters
        ----------
        host:
            Technical template name (unique identifier).
        groups:
            Template groups the template belongs to,
            e.g. ``[{"groupid": "10"}]``.
        **params:
            Optional fields: ``name`` (visible name), ``description``,
            ``templates`` (parent templates to inherit from), ``tags``,
            ``macros``.

        Returns
        -------
        list[str]
            IDs of the created templates (``templateids``).
        """
        payload: dict[str, Any] = {"host": host, "groups": groups, **params}
        result = self._t.request("template.create", payload)
        return result.get("templateids", [])

    def update(self, templateid: str, **params: Any) -> list[str]:
        """
        Update an existing template.

        Parameters
        ----------
        templateid:
            ID of the template to update.
        **params:
            Fields to change, e.g. ``name``, ``description``,
            ``groups``, ``templates``, ``tags``, ``macros``.

        Returns
        -------
        list[str]
            IDs of the updated templates.
        """
        result = self._t.request("template.update", {"templateid": templateid, **params})
        return result.get("templateids", [])

    def delete(self, *templateids: str) -> list[str]:
        """
        Delete one or more templates.

        Deleting a template unlinks it from all hosts and removes all
        items/triggers/etc. inherited from it.

        Returns
        -------
        list[str]
            IDs of the deleted templates.
        """
        result = self._t.request("template.delete", list(templateids))
        return result.get("templateids", [])

    def mass_add(self, **params: Any) -> dict:
        """
        Link templates and host groups to multiple templates at once.

        Common parameters
        -----------------
        templates : list[dict]
            Target templates to update, e.g. ``[{"templateid": "10050"}]``.
        templates_link : list[dict]
            Parent templates to link.
        groups : list[dict]
            Host groups to add.

        Returns
        -------
        dict
            Contains ``templateids``.
        """
        return self._t.request("template.massadd", params)

    def mass_remove(self, **params: Any) -> dict:
        """
        Unlink templates and remove host groups from multiple templates.

        Common parameters
        -----------------
        templateids : list[str]
            IDs of the templates to update.
        templateids_link : list[str]
            IDs of parent templates to unlink.
        templateids_clear : list[str]
            IDs of parent templates to unlink and clear.
        groupids : list[str]
            IDs of host groups to remove.

        Returns
        -------
        dict
            Contains ``templateids``.
        """
        return self._t.request("template.massremove", params)
