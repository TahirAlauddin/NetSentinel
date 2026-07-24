"""
Transform Zabbix API objects into NetSentinel monitoring API responses.
"""

from datetime import datetime, timezone

from .constants import (
    ACTION_SOURCE_TO_API,
    ACTION_STATUS_TO_API,
    API_HOST_STATUS,
    API_SEVERITY,
    AVAILABILITY_TO_API,
    EVENT_SOURCE_TO_API,
    EVENT_VALUE_TO_API,
    HOST_STATUS_MONITORED,
    HOST_STATUS_TO_API,
    INVENTORY_MODE_TO_API,
    ITEM_STATUS_TO_API,
    ITEM_TYPE_TO_ZABBIX,
    MAINTENANCE_TYPE_TO_API,
    MEDIA_TYPE_TO_API,
    PROXY_MODE_TO_API,
    SEVERITY_COLORS,
    SEVERITY_TO_API,
    TRIGGER_STATUS_TO_API,
    TRIGGER_VALUE_TO_STATE,
    VALUE_TYPE_TO_API,
    VALUE_TYPE_TO_ZABBIX,
    ZABBIX_ITEM_TYPE,
    empty_timestamps,
    iso_timestamp,
    zabbix_id,
)


def _choice(mapping: dict, key, default=0):
    return mapping.get(int(key) if key is not None else default, mapping.get(default, ("", "")))


def format_duration(seconds: int) -> str:
    if seconds < 0:
        seconds = 0
    hours, remainder = divmod(seconds, 3600)
    minutes, secs = divmod(remainder, 60)
    if hours > 0:
        return f"{hours}h {minutes}m {secs}s"
    if minutes > 0:
        return f"{minutes}m {secs}s"
    return f"{secs}s"


def map_host_group(row: dict, host_count: int = 0) -> dict:
    return {
        "id": zabbix_id(row.get("groupid")),
        "name": row.get("name", ""),
        "description": "",
        "host_count": host_count,
        **empty_timestamps(),
    }


def map_template_group(row: dict, template_count: int = 0) -> dict:
    return {
        "id": zabbix_id(row.get("groupid")),
        "name": row.get("name", ""),
        "description": "",
        "template_count": template_count,
        **empty_timestamps(),
    }


def map_host(
    row: dict,
    *,
    problem_count: int = 0,
    item_count: int | None = None,
    trigger_count: int | None = None,
) -> dict:
    status_key, status_label = _choice(HOST_STATUS_TO_API, row.get("status", 0))

    interfaces = row.get("interfaces") or []
    main_iface = next(
        (i for i in interfaces if str(i.get("main")) == "1"), interfaces[0] if interfaces else {}
    )
    use_dns = str(main_iface.get("useip", "1")) == "0"
    ip_address = main_iface.get("ip") or None
    dns_name = main_iface.get("dns") or ""
    port = int(main_iface.get("port") or 10050)

    avail = 0
    for iface in interfaces:
        a = int(iface.get("available", 0))
        if a == 2:
            avail = 2
            break
        if a == 1:
            avail = 1
    avail_key, avail_label = _choice(AVAILABILITY_TO_API, avail)

    groups = row.get("parentGroups") or row.get("groups") or []
    host_groups_detail = [
        {
            "id": zabbix_id(g.get("groupid")),
            "name": g.get("name", ""),
            "description": "",
            "host_count": 0,
            **empty_timestamps(),
        }
        for g in groups
    ]
    templates_raw = row.get("parentTemplates") or row.get("templates") or []
    templates_detail = [
        {"id": zabbix_id(t.get("templateid")), "name": t.get("name") or t.get("host", "")}
        for t in templates_raw
    ]

    inventory = row.get("inventory") or {}
    inv_mode_key, _ = _choice(INVENTORY_MODE_TO_API, row.get("inventory_mode", -1))

    tags = row.get("tags") or []
    mapped_tags = [
        {"id": idx, "tag": t.get("tag", ""), "value": t.get("value", "")}
        for idx, t in enumerate(tags, start=1)
    ]

    proxy_id = row.get("proxyid")
    proxy_detail = None
    if proxy_id and str(proxy_id) != "0":
        proxy_detail = {
            "id": zabbix_id(proxy_id),
            "name": row.get("proxy_hostid", ""),
            "mode": "active",
            "mode_display": "Active",
            "address": "",
            "port": 10051,
            "description": "",
            "status": "enabled",
            "status_display": "Enabled",
            "tls_connect": "no_encryption",
            "tls_accept": "no_encryption",
            **empty_timestamps(),
        }

    display_address = dns_name if use_dns and dns_name else (ip_address or dns_name or "")

    return {
        "id": zabbix_id(row.get("hostid")),
        "name": row.get("host", ""),
        "visible_name": row.get("name") or row.get("host", ""),
        "description": row.get("description") or "",
        "ip_address": ip_address,
        "dns_name": dns_name,
        "use_dns": use_dns,
        "port": port,
        "status": status_key,
        "status_display": status_label,
        "inventory_mode": inv_mode_key,
        "availability": avail_key,
        "availability_display": avail_label,
        "host_groups": [g["id"] for g in host_groups_detail],
        "host_groups_detail": host_groups_detail,
        "templates": [t["id"] for t in templates_detail],
        "templates_detail": templates_detail,
        "proxy": zabbix_id(proxy_id) if proxy_id and str(proxy_id) != "0" else None,
        "proxy_detail": proxy_detail,
        "tags": mapped_tags,
        "snmp_version": "",
        "snmp_community": "",
        "snmp_port": 161,
        "snmp_bulk": True,
        "jmx_port": 12345,
        "ipmi_authtype": "",
        "ipmi_privilege": "",
        "ipmi_username": "",
        "ipmi_password": "",
        "tls_connect": "no_encryption",
        "tls_accept": "no_encryption",
        "location": inventory.get("location", ""),
        "os": inventory.get("os", ""),
        "hardware": inventory.get("hardware", ""),
        "software": inventory.get("software", ""),
        "asset_tag": inventory.get("asset_tag", ""),
        "serial_number": inventory.get("serialno_a", "") or inventory.get("serialno_b", ""),
        "model": inventory.get("model", ""),
        "vendor": inventory.get("vendor", ""),
        "display_address": display_address,
        "problem_count": problem_count,
        **empty_timestamps(),
    }


def map_template(row: dict, *, item_count: int = 0, trigger_count: int = 0) -> dict:
    template_groups_raw = row.get("templategroups") or row.get("templateGroups") or []
    template_groups_detail = [map_template_group(g) for g in template_groups_raw]
    linked = row.get("parentTemplates") or []
    tags = row.get("tags") or []
    macros_raw = row.get("macros") or []
    valuemaps_raw = row.get("valuemaps") or []
    technical_name = row.get("host", "")
    visible_name = row.get("name") or technical_name
    return {
        "id": zabbix_id(row.get("templateid")),
        "name": visible_name,
        "technical_name": technical_name,
        "visible_name": visible_name,
        "description": row.get("description") or "",
        "template_groups": [g["id"] for g in template_groups_detail],
        "template_groups_detail": template_groups_detail,
        "linked_templates": [zabbix_id(t.get("templateid")) for t in linked],
        "linked_templates_detail": [
            {"id": zabbix_id(t.get("templateid")), "name": t.get("name") or t.get("host", "")}
            for t in linked
        ],
        "tags": [
            {"id": i, "tag": t.get("tag", ""), "value": t.get("value", "")}
            for i, t in enumerate(tags, 1)
        ],
        "macros": [
            {
                "macro": m.get("macro", ""),
                "value": m.get("value", ""),
                "description": m.get("description", ""),
            }
            for m in macros_raw
        ],
        "value_maps": [
            {
                "id": zabbix_id(vm.get("valuemapid")),
                "name": vm.get("name", ""),
                "mappings": [
                    {
                        "type": str(mapping.get("type", "0")),
                        "value": mapping.get("value", ""),
                        "newvalue": mapping.get("newvalue", ""),
                    }
                    for mapping in (vm.get("mappings") or [])
                ],
            }
            for vm in valuemaps_raw
        ],
        "item_count": item_count,
        "trigger_count": trigger_count,
        **empty_timestamps(),
    }


def map_item(row: dict) -> dict:
    type_key = ZABBIX_ITEM_TYPE.get(int(row.get("type", 0)), "zabbix_agent")
    type_label = type_key.replace("_", " ").title()
    vt_key, vt_label = _choice(VALUE_TYPE_TO_API, row.get("value_type", 0))
    st_key, st_label = _choice(ITEM_STATUS_TO_API, row.get("status", 0))

    hosts = row.get("hosts") or []
    templates = row.get("templates") or []
    host_id = zabbix_id(hosts[0].get("hostid")) if hosts else None
    template_id = zabbix_id(templates[0].get("templateid")) if templates else None

    return {
        "id": zabbix_id(row.get("itemid")),
        "host": host_id,
        "host_name": hosts[0].get("name") if hosts else None,
        "template": template_id,
        "template_name": (
            (templates[0].get("name") or templates[0].get("host")) if templates else None
        ),
        "name": row.get("name", ""),
        "key": row.get("key_", ""),
        "item_type": type_key,
        "item_type_display": type_label,
        "value_type": vt_key,
        "value_type_display": vt_label,
        "units": row.get("units") or "",
        "delay": row.get("delay", "1m"),
        "history": row.get("history", "90d"),
        "trends": row.get("trends", "365d"),
        "status": st_key,
        "status_display": st_label,
        "description": row.get("description") or "",
        "snmp_oid": row.get("snmp_oid") or "",
        "url": row.get("url") or "",
        "http_method": "",
        "request_body": "",
        "status_codes": "200",
        "timeout": row.get("timeout") or "15s",
        "params": row.get("params") or "",
        "allowed_hosts": "",
        "value_map": "",
        **empty_timestamps(),
    }


def map_trigger(row: dict) -> dict:
    sev_key, sev_label = _choice(SEVERITY_TO_API, row.get("priority", 3))
    st_key, st_label = _choice(TRIGGER_STATUS_TO_API, row.get("status", 0))
    state_key, state_label = _choice(TRIGGER_VALUE_TO_STATE, row.get("value", 0))

    hosts = row.get("hosts") or []
    templates = row.get("templates") or []
    host_id = zabbix_id(hosts[0].get("hostid")) if hosts else None
    template_id = zabbix_id(templates[0].get("templateid")) if templates else None

    return {
        "id": zabbix_id(row.get("triggerid")),
        "host": host_id,
        "host_name": hosts[0].get("name") or hosts[0].get("host") if hosts else None,
        "template": template_id,
        "template_name": (
            (templates[0].get("name") or templates[0].get("host")) if templates else None
        ),
        "name": row.get("description", ""),
        "expression": row.get("expression", ""),
        "recovery_expression": row.get("recovery_expression") or "",
        "recovery_mode": "expression",
        "correlation_mode": "disabled",
        "correlation_tag": "",
        "severity": sev_key,
        "severity_display": sev_label,
        "severity_color": SEVERITY_COLORS.get(sev_key, "#97AAB3"),
        "status": st_key,
        "status_display": st_label,
        "state": state_key,
        "state_display": state_label,
        "description": row.get("comments") or "",
        "url": row.get("url") or "",
        "comments": row.get("comments") or "",
        "manual_close": str(row.get("manual_close", "0")) == "1",
        "generate_multiple_events": False,
        **empty_timestamps(),
    }


def map_problem(
    row: dict, *, host_name: str | None = None, trigger_name: str | None = None
) -> dict:
    sev_key, sev_label = _choice(SEVERITY_TO_API, row.get("severity", 3))
    acknowledged = str(row.get("acknowledged", "0")) == "1"
    r_clock = row.get("r_clock")
    is_resolved = r_clock not in (None, "", "0")
    clock = iso_timestamp(row.get("clock"))
    r_clock_iso = iso_timestamp(r_clock) if is_resolved else None

    duration_secs = 0
    if row.get("clock"):
        end = (
            int(r_clock)
            if is_resolved and r_clock
            else int(datetime.now(tz=timezone.utc).timestamp())
        )
        duration_secs = end - int(row["clock"])

    tags = row.get("tags") or []
    return {
        "id": zabbix_id(row.get("eventid")),
        "host": zabbix_id(row.get("hostid")) if row.get("hostid") else None,
        "host_name": host_name or row.get("host_name"),
        "trigger": zabbix_id(row.get("objectid")),
        "trigger_name": trigger_name or row.get("name"),
        "name": row.get("name", ""),
        "severity": sev_key,
        "severity_display": sev_label,
        "status": "resolved" if is_resolved else "active",
        "status_display": "Resolved" if is_resolved else "Active",
        "clock": clock,
        "r_clock": r_clock_iso,
        "acknowledged": acknowledged,
        "ack_message": "",
        "ack_time": None,
        "suppressed": str(row.get("suppressed", "0")) == "1",
        "tags": [{"tag": t.get("tag", ""), "value": t.get("value", "")} for t in tags],
        "is_manual": False,
        "note": "",
        "duration": format_duration(duration_secs),
        **empty_timestamps(),
    }


def map_event(row: dict) -> dict:
    src_key, src_label = _choice(EVENT_SOURCE_TO_API, row.get("source", 0))
    val_key, val_label = _choice(EVENT_VALUE_TO_API, row.get("value", 0))
    sev_key, sev_label = _choice(SEVERITY_TO_API, row.get("severity", 0))

    hosts = row.get("hosts") or []
    triggers = row.get("relatedObject") or row.get("triggers") or []
    if isinstance(triggers, dict):
        triggers = [triggers]

    return {
        "id": zabbix_id(row.get("eventid")),
        "host": zabbix_id(hosts[0].get("hostid")) if hosts else None,
        "host_name": hosts[0].get("name") or hosts[0].get("host") if hosts else None,
        "trigger": (
            zabbix_id(triggers[0].get("triggerid")) if triggers else zabbix_id(row.get("objectid"))
        ),
        "trigger_name": triggers[0].get("description") if triggers else None,
        "problem": zabbix_id(row.get("eventid")),
        "source": src_key,
        "source_display": src_label,
        "value": val_key,
        "value_display": val_label,
        "name": row.get("name", ""),
        "severity": sev_key,
        "severity_display": sev_label,
        "clock": iso_timestamp(row.get("clock")),
        "acknowledged": str(row.get("acknowledged", "0")) == "1",
        "r_eventid": (
            zabbix_id(row.get("r_eventid"))
            if row.get("r_eventid") and str(row.get("r_eventid")) != "0"
            else None
        ),
        "action_results": [],
    }


def map_maintenance(
    row: dict, *, hosts_detail: list | None = None, groups_detail: list | None = None
) -> dict:
    mt_key, mt_label = _choice(MAINTENANCE_TYPE_TO_API, row.get("maintenance_type", 0))
    active_since = iso_timestamp(row.get("active_since"))
    active_till = iso_timestamp(row.get("active_till"))

    now = datetime.now(tz=timezone.utc)
    status = "expired"
    is_active = False
    try:
        since_dt = datetime.fromtimestamp(int(row.get("active_since", 0)), tz=timezone.utc)
        till_dt = datetime.fromtimestamp(int(row.get("active_till", 0)), tz=timezone.utc)
        if now < since_dt:
            status = "upcoming"
        elif now <= till_dt:
            status = "active"
            is_active = True
    except (TypeError, ValueError, OSError):
        pass

    hostids = row.get("hostids") or []
    groupids = row.get("groupids") or []

    return {
        "id": zabbix_id(row.get("maintenanceid")),
        "name": row.get("name", ""),
        "description": row.get("description") or "",
        "maintenance_type": mt_key,
        "maintenance_type_display": mt_label,
        "active_since": active_since,
        "active_till": active_till,
        "hosts": [zabbix_id(h) for h in hostids],
        "hosts_detail": hosts_detail or [],
        "host_groups": [zabbix_id(g) for g in groupids],
        "host_groups_detail": groups_detail or [],
        "status": status,
        "is_active": is_active,
        **empty_timestamps(),
    }


def map_action(row: dict) -> dict:
    src_key, src_label = _choice(ACTION_SOURCE_TO_API, row.get("eventsource", 0))
    st_key, st_label = _choice(ACTION_STATUS_TO_API, row.get("status", 0))

    conditions = []
    for idx, cond in enumerate(
        row.get("filter", {}).get("conditions", []) if isinstance(row.get("filter"), dict) else [],
        1,
    ):
        conditions.append(
            {
                "id": idx,
                "condition_type": str(cond.get("conditiontype", "")),
                "operator": str(cond.get("operator", "")),
                "value": cond.get("value", ""),
                "value2": cond.get("value2", ""),
                "formula_id": cond.get("formulaid", ""),
            }
        )

    operations = []
    for idx, op in enumerate(row.get("operations") or [], 1):
        operations.append(
            {
                "id": idx,
                "operation_type": "send_message",
                "op_step_from": int(op.get("esc_step_from", 1)),
                "op_step_to": int(op.get("esc_step_to", 1)),
                "op_step_duration": 0,
                "default_msg": True,
                "message_subject": "",
                "message_body": op.get("default_msg", ""),
                "media_type": zabbix_id(op.get("mediatypeid")) if op.get("mediatypeid") else None,
                "media_type_detail": None,
                "command_type": "",
                "command": op.get("command", ""),
                "execute_on": "zabbix_agent",
                "run_script_on_zabbix_agent": False,
            }
        )

    return {
        "id": zabbix_id(row.get("actionid")),
        "name": row.get("name", ""),
        "eventsource": src_key,
        "eventsource_display": src_label,
        "status": st_key,
        "status_display": st_label,
        "eval_type": "and_or",
        "formula": "",
        "pause_suppressed": True,
        "notify_if_canceled": True,
        "conditions": conditions,
        "operations": operations,
        "condition_count": len(conditions),
        "operation_count": len(operations),
        **empty_timestamps(),
    }


def map_proxy(row: dict) -> dict:
    mode_key, mode_label = _choice(PROXY_MODE_TO_API, row.get("mode", 5))
    # Zabbix proxy status: 5 = active proxy online, 6 = offline — simplify to enabled/disabled
    status = "enabled"
    status_label = "Enabled"
    return {
        "id": zabbix_id(row.get("proxyid")),
        "name": row.get("name", ""),
        "mode": mode_key,
        "mode_display": mode_label,
        "address": row.get("address") or "",
        "port": int(row.get("port") or 10051),
        "description": row.get("description") or "",
        "status": status,
        "status_display": status_label,
        "tls_connect": "no_encryption",
        "tls_accept": "no_encryption",
        **empty_timestamps(),
    }


def map_media_type(row: dict) -> dict:
    mt_key, mt_label = _choice(MEDIA_TYPE_TO_API, row.get("type", 0))
    st_key, st_label = _choice(ACTION_STATUS_TO_API, row.get("status", 0))
    return {
        "id": zabbix_id(row.get("mediatypeid")),
        "name": row.get("name", ""),
        "media_type": mt_key,
        "media_type_display": mt_label,
        "status": st_key,
        "status_display": st_label,
        "description": row.get("description") or "",
        "smtp_server": row.get("smtp_server") or "",
        "smtp_port": int(row.get("smtp_port") or 25),
        "smtp_helo": row.get("smtp_helo") or "",
        "smtp_email": row.get("smtp_email") or "",
        "smtp_authentication": "none",
        "smtp_username": "",
        "smtp_security": "none",
        "content_type": "text",
        "script_name": row.get("exec_path") or "",
        "webhook_url": "",
        "webhook_headers": {},
        "default_subject": "",
        "default_message": "",
        "max_sessions": int(row.get("maxsessions") or 1),
        "max_attempts": int(row.get("attempts") or 3),
        "attempt_interval": "10s",
        **empty_timestamps(),
    }


# Re-export for payload building
def host_status_to_zabbix(status: str) -> int:
    return API_HOST_STATUS.get(status, HOST_STATUS_MONITORED)


def item_type_to_zabbix(item_type: str) -> int:
    return ITEM_TYPE_TO_ZABBIX.get(item_type, 0)


def value_type_to_zabbix(value_type: str) -> int:
    return VALUE_TYPE_TO_ZABBIX.get(value_type, 0)


def severity_to_zabbix(severity: str) -> int:
    return API_SEVERITY.get(severity, 3)
