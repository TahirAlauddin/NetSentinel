"""
Inactive Hosts Detection Service.

Detects and manages inactive/stale IP address assignments based on last seen/updated timestamps.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional

from django.db.models import Q
from django.utils import timezone

from ..models import IPAddress


def detect_inactive_hosts(
    threshold_days: int = 90,
    status_filter: Optional[str] = None,
    subnet_id: Optional[int] = None,
) -> List[IPAddress]:
    """
    Detect inactive IP addresses based on last update timestamp.

    Args:
        threshold_days: Number of days since last update to consider inactive (default: 90)
        status_filter: Filter by IP status (e.g., 'assigned', 'dhcp')
        subnet_id: Filter by subnet ID

    Returns:
        List of inactive IPAddress instances
    """
    threshold_date = timezone.now() - timedelta(days=threshold_days)

    # Build queryset
    queryset = IPAddress.objects.filter(
        Q(updated_at__lt=threshold_date) | Q(updated_at__isnull=True)
    )

    # Filter by status if provided
    if status_filter:
        queryset = queryset.filter(status=status_filter)

    # Filter by subnet if provided
    if subnet_id:
        queryset = queryset.filter(subnet_id=subnet_id)

    # Only include IPs that are assigned or have been assigned
    queryset = queryset.filter(
        Q(status__in=["assigned", "dhcp", "reserved"])
        | Q(assigned_to_asset__isnull=False)
    )

    return list(queryset.select_related("subnet", "assigned_to_asset", "assigned_by"))


def get_inactive_hosts_summary(
    threshold_days: int = 90,
) -> Dict:
    """
    Get summary statistics for inactive hosts.

    Args:
        threshold_days: Number of days since last update to consider inactive

    Returns:
        Dictionary with summary statistics
    """
    inactive_hosts = detect_inactive_hosts(threshold_days=threshold_days)

    summary = {
        "total_inactive": len(inactive_hosts),
        "by_status": {},
        "by_subnet": {},
        "oldest_inactive": None,
        "threshold_days": threshold_days,
    }

    # Count by status
    for ip in inactive_hosts:
        status = ip.status
        summary["by_status"][status] = summary["by_status"].get(status, 0) + 1

    # Count by subnet
    for ip in inactive_hosts:
        if ip.subnet:
            subnet_network = ip.subnet.network
            summary["by_subnet"][subnet_network] = (
                summary["by_subnet"].get(subnet_network, 0) + 1
            )

    # Find oldest inactive IP
    if inactive_hosts:
        oldest = min(inactive_hosts, key=lambda x: x.updated_at or x.created_at)
        summary["oldest_inactive"] = {
            "address": oldest.address,
            "last_updated": (
                oldest.updated_at.isoformat() if oldest.updated_at else None
            ),
            "days_inactive": (
                (timezone.now() - (oldest.updated_at or oldest.created_at)).days
            ),
        }

    return summary


def bulk_release_inactive_hosts(
    ip_ids: List[int],
    release_reason: str = "Inactive host cleanup",
) -> Dict:
    """
    Bulk release inactive IP addresses.

    Args:
        ip_ids: List of IP address IDs to release
        release_reason: Reason for release

    Returns:
        Dictionary with release results
    """
    from ..models import IPAddress

    results = {
        "released": 0,
        "failed": 0,
        "errors": [],
    }

    for ip_id in ip_ids:
        try:
            ip = IPAddress.objects.get(id=ip_id)
            # Release the IP
            ip.assigned_to_asset = None
            ip.assigned_by = None
            ip.assigned_at = None
            ip.status = "available"
            if ip.description:
                ip.description = f"{ip.description}\n[Released: {release_reason}]"
            else:
                ip.description = f"[Released: {release_reason}]"
            ip.save()
            results["released"] += 1
        except IPAddress.DoesNotExist:
            results["failed"] += 1
            results["errors"].append(f"IP address {ip_id} not found")
        except Exception as e:
            results["failed"] += 1
            results["errors"].append(f"Error releasing IP {ip_id}: {str(e)}")

    return results


def bulk_mark_deprecated(
    ip_ids: List[int],
    reason: str = "Inactive host",
) -> Dict:
    """
    Bulk mark inactive IP addresses as deprecated.

    Args:
        ip_ids: List of IP address IDs to mark as deprecated
        reason: Reason for deprecation

    Returns:
        Dictionary with deprecation results
    """
    from ..models import IPAddress

    results = {
        "deprecated": 0,
        "failed": 0,
        "errors": [],
    }

    for ip_id in ip_ids:
        try:
            ip = IPAddress.objects.get(id=ip_id)
            ip.status = "deprecated"
            if ip.description:
                ip.description = f"{ip.description}\n[Deprecated: {reason}]"
            else:
                ip.description = f"[Deprecated: {reason}]"
            ip.save()
            results["deprecated"] += 1
        except IPAddress.DoesNotExist:
            results["failed"] += 1
            results["errors"].append(f"IP address {ip_id} not found")
        except Exception as e:
            results["failed"] += 1
            results["errors"].append(f"Error deprecating IP {ip_id}: {str(e)}")

    return results
