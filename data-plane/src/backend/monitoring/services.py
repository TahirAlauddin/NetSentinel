"""Zabbix query helpers shared across monitoring views."""

from .mappers import map_host
from .zabbix_client import get_zabbix_client


def build_host_problem_counts() -> dict[str, int]:
    """
    Map Zabbix hostid -> active problem count.
    """
    zabbix = get_zabbix_client()
    problems = zabbix.problems.get(output=["eventid", "objectid"])
    if not problems:
        return {}

    trigger_ids = list({p["objectid"] for p in problems if p.get("objectid")})
    if not trigger_ids:
        return {}

    triggers = zabbix.triggers.get(
        triggerids=trigger_ids,
        output=["triggerid"],
        selectHosts=["hostid"],
    )
    trigger_to_host: dict[str, str] = {}
    for trigger in triggers:
        hosts = trigger.get("hosts") or []
        if hosts:
            trigger_to_host[trigger["triggerid"]] = hosts[0]["hostid"]

    counts: dict[str, int] = {}
    for problem in problems:
        hostid = trigger_to_host.get(problem.get("objectid", ""))
        if hostid:
            counts[hostid] = counts.get(hostid, 0) + 1
    return counts


def fetch_hosts_with_filters(request_params) -> list[dict]:
    zabbix = get_zabbix_client()
    params: dict = {
        "output": "extend",
        "selectInterfaces": "extend",
        "selectGroups": "extend",
        "selectParentTemplates": ["templateid", "name", "host"],
        "selectTags": "extend",
        "selectInventory": "extend",
        "filter": {"flags": "0"},
    }

    search = request_params.get("search")
    if search:
        params["search"] = {"name": search, "host": search}

    host_group = request_params.get("host_group")
    if host_group:
        params["groupids"] = [str(host_group)]

    status_filter = request_params.get("status")
    if status_filter == "monitored":
        params["monitored_hosts"] = 1
    elif status_filter == "unmonitored":
        params["filter"] = {**params.get("filter", {}), "status": 1}

    template = request_params.get("template")
    if template:
        params["templateids"] = [str(template)]

    rows = zabbix.hosts.get(**params)
    problem_counts = build_host_problem_counts()

    availability_filter = request_params.get("availability")
    mapped = []
    for row in rows:
        host = map_host(row, problem_count=problem_counts.get(row["hostid"], 0))
        if availability_filter and host["availability"] != availability_filter:
            continue
        mapped.append(host)
    return mapped
