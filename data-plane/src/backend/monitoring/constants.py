"""Maps between NetSentinel API values and Zabbix API integers."""

from datetime import datetime, timezone

# Host status: 0 = monitored, 1 = not monitored
HOST_STATUS_MONITORED = 0
HOST_STATUS_UNMONITORED = 1

HOST_STATUS_TO_API = {
    HOST_STATUS_MONITORED: ("monitored", "Monitored"),
    HOST_STATUS_UNMONITORED: ("unmonitored", "Not monitored"),
}
API_HOST_STATUS = {v[0]: k for k, v in HOST_STATUS_TO_API.items()}

# Interface availability: 0 = unknown, 1 = available, 2 = unavailable
AVAILABILITY_TO_API = {
    0: ("unknown", "Unknown"),
    1: ("available", "Available"),
    2: ("unavailable", "Unavailable"),
}

# Inventory mode
INVENTORY_MODE_TO_API = {
    -1: ("disabled", "Disabled"),
    0: ("disabled", "Disabled"),
    1: ("manual", "Manual"),
    2: ("automatic", "Automatic"),
}
API_INVENTORY_MODE = {"disabled": -1, "manual": 1, "automatic": 2}

# Trigger / problem severity
SEVERITY_TO_API = {
    0: ("not_classified", "Not classified"),
    1: ("information", "Information"),
    2: ("warning", "Warning"),
    3: ("average", "Average"),
    4: ("high", "High"),
    5: ("disaster", "Disaster"),
}
API_SEVERITY = {v[0]: k for k, v in SEVERITY_TO_API.items()}
SEVERITY_COLORS = {
    "not_classified": "#97AAB3",
    "information": "#7499FF",
    "warning": "#FFC859",
    "average": "#FFA059",
    "high": "#E97659",
    "disaster": "#E45959",
}

# Item status: 0 = enabled, 1 = disabled
ITEM_STATUS_TO_API = {
    0: ("enabled", "Enabled"),
    1: ("disabled", "Disabled"),
}
API_ITEM_STATUS = {v[0]: k for k, v in ITEM_STATUS_TO_API.items()}

# Item types (Zabbix item.type)
ITEM_TYPE_TO_ZABBIX = {
    "zabbix_agent": 0,
    "zabbix_agent_active": 7,
    "snmp_v1": 1,
    "snmp_v2c": 4,
    "snmp_v3": 6,
    "snmp_trap": 17,
    "internal": 5,
    "external": 10,
    "database_monitor": 11,
    "http_agent": 19,
    "ipmi": 12,
    "ssh": 13,
    "telnet": 14,
    "jmx": 16,
    "calculated": 15,
    "trapper": 2,
    "aggregate": 8,
    "dependent": 18,
}
ZABBIX_ITEM_TYPE = {v: k for k, v in ITEM_TYPE_TO_ZABBIX.items()}

# Value types
VALUE_TYPE_TO_ZABBIX = {
    "float": 0,
    "character": 1,
    "log": 2,
    "unsigned_int": 3,
    "text": 4,
}
ZABBIX_VALUE_TYPE = {v: k for k, v in VALUE_TYPE_TO_ZABBIX.items()}
VALUE_TYPE_TO_API = {
    0: ("float", "Numeric (float)"),
    1: ("character", "Character"),
    2: ("log", "Log"),
    3: ("unsigned_int", "Numeric (unsigned)"),
    4: ("text", "Text"),
}

# Trigger status / state
TRIGGER_STATUS_TO_API = {
    0: ("enabled", "Enabled"),
    1: ("disabled", "Disabled"),
}
API_TRIGGER_STATUS = {v[0]: k for k, v in TRIGGER_STATUS_TO_API.items()}
TRIGGER_VALUE_TO_STATE = {
    0: ("normal", "Normal (OK)"),
    1: ("problem", "Problem"),
}

# Event source
EVENT_SOURCE_TO_API = {
    0: ("trigger", "Trigger"),
    1: ("discovery", "Discovery"),
    2: ("autoregistration", "Autoregistration"),
    3: ("internal", "Internal"),
    4: ("service", "Service"),
}
API_EVENT_SOURCE = {v[0]: k for k, v in EVENT_SOURCE_TO_API.items()}

# Event value
EVENT_VALUE_TO_API = {
    0: ("ok", "OK"),
    1: ("problem", "Problem"),
}

# Proxy mode: 5 = active, 6 = passive (Zabbix 6+)
PROXY_MODE_TO_API = {
    5: ("active", "Active"),
    6: ("passive", "Passive"),
    0: ("active", "Active"),
    1: ("passive", "Passive"),
}
API_PROXY_MODE = {"active": 5, "passive": 6}

# Maintenance type
MAINTENANCE_TYPE_TO_API = {
    0: ("with_data_collection", "With data collection"),
    1: ("no_data_collection", "No data collection"),
}
API_MAINTENANCE_TYPE = {v[0]: k for k, v in MAINTENANCE_TYPE_TO_API.items()}

# Action
ACTION_STATUS_TO_API = {
    0: ("enabled", "Enabled"),
    1: ("disabled", "Disabled"),
}
API_ACTION_STATUS = {v[0]: k for k, v in ACTION_STATUS_TO_API.items()}
ACTION_SOURCE_TO_API = {
    0: ("trigger", "Trigger"),
    1: ("discovery", "Discovery"),
    2: ("autoregistration", "Autoregistration"),
    3: ("internal", "Internal"),
    4: ("service", "Service"),
}
API_ACTION_SOURCE = {v[0]: k for k, v in ACTION_SOURCE_TO_API.items()}

# Media type
MEDIA_TYPE_TO_API = {
    0: ("email", "Email"),
    1: ("script", "Script"),
    2: ("sms", "SMS"),
    4: ("webhook", "Webhook"),
}
API_MEDIA_TYPE = {v[0]: k for k, v in MEDIA_TYPE_TO_API.items()}


def zabbix_id(value) -> int:
    """Convert Zabbix string IDs to int for the frontend."""
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def iso_timestamp(unix_ts: str | int | None) -> str:
    if unix_ts in (None, "", "0"):
        return ""
    try:
        return datetime.fromtimestamp(int(unix_ts), tz=timezone.utc).isoformat()
    except (TypeError, ValueError, OSError):
        return ""


def empty_timestamps() -> dict:
    return {"created_at": "", "updated_at": ""}
