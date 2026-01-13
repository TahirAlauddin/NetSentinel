"""
IPAM Services Module.

This module exports all IPAM-related services for use throughout the application.
"""

from .duplicates_detection import (
    detect_duplicate_ips,
    detect_duplicate_subnets,
    get_duplicates_summary,
    resolve_duplicate,
    suggest_resolution,
)
from .inactive_hosts import (
    bulk_mark_deprecated,
    bulk_release_inactive_hosts,
    detect_inactive_hosts,
    get_inactive_hosts_summary,
)
from .ip_assignment import assign_ip_to_asset, release_ip_from_asset
from .ip_import_export import (
    export_ip_addresses_to_csv,
    export_ip_addresses_to_json,
    import_ip_addresses,
    parse_csv_import,
    parse_json_import,
    validate_import_data,
)
from .ip_search import (
    detect_ip_conflicts,
    find_available_ips_in_subnet,
    get_ip_details,
    search_by_hostname,
    search_ip_addresses,
    search_ip_range,
)
from .subnet_utilization import (
    calculate_subnet_utilization,
    get_all_subnets_utilization,
    get_utilization_summary,
)
from .subnet_utils import (
    calculate_next_available_ip,
    detect_subnet_overlap,
    is_ip_in_subnet,
)

__all__ = [
    # Duplicates Detection
    "detect_duplicate_ips",
    "detect_duplicate_subnets",
    "get_duplicates_summary",
    "resolve_duplicate",
    "suggest_resolution",
    # Inactive Hosts
    "bulk_mark_deprecated",
    "bulk_release_inactive_hosts",
    "detect_inactive_hosts",
    "get_inactive_hosts_summary",
    # IP Assignment
    "assign_ip_to_asset",
    "release_ip_from_asset",
    # IP Import/Export
    "export_ip_addresses_to_csv",
    "export_ip_addresses_to_json",
    "import_ip_addresses",
    "parse_csv_import",
    "parse_json_import",
    "validate_import_data",
    # IP Search
    "detect_ip_conflicts",
    "find_available_ips_in_subnet",
    "get_ip_details",
    "search_by_hostname",
    "search_ip_addresses",
    "search_ip_range",
    # Subnet Utilization
    "calculate_subnet_utilization",
    "get_all_subnets_utilization",
    "get_utilization_summary",
    # Subnet Utils
    "calculate_next_available_ip",
    "detect_subnet_overlap",
    "is_ip_in_subnet",
]
