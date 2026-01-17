"""
IP Address Audit Log Service.

Provides functions for logging IP address changes and querying audit logs.
"""

from typing import Dict, List, Optional

from django.contrib.auth import get_user_model
from django.utils import timezone

from ..models import IPAddress, IPAuditLog

User = get_user_model()


def log_ip_action(
    ip_address: Optional[IPAddress],
    action: str,
    user: Optional[User] = None,
    field_name: Optional[str] = None,
    old_value: Optional[str] = None,
    new_value: Optional[str] = None,
    reason: Optional[str] = None,
    metadata: Optional[Dict] = None,
) -> IPAuditLog:
    """
    Log an IP address action.

    Args:
        ip_address: IPAddress instance (can be None for deleted IPs)
        action: Action type (from IPAuditLog.ACTION_CHOICES)
        user: User who performed the action
        field_name: Field that was changed (if applicable)
        old_value: Previous value (if applicable)
        new_value: New value (if applicable)
        reason: Reason/justification for the change
        metadata: Additional metadata

    Returns:
        Created IPAuditLog instance
    """
    # Get IP address string
    if ip_address:
        ip_address_str = ip_address.address
        subnet_id = ip_address.subnet.id if ip_address.subnet else None
        subnet_network = ip_address.subnet.network if ip_address.subnet else None
    else:
        # For deleted IPs, use metadata
        ip_address_str = metadata.get("ip_address", "") if metadata else ""
        subnet_id = metadata.get("subnet_id") if metadata else None
        subnet_network = metadata.get("subnet_network") if metadata else None

    # Get username
    username = user.username if user else None

    # Convert values to strings if needed
    if old_value is not None and not isinstance(old_value, str):
        old_value = str(old_value)
    if new_value is not None and not isinstance(new_value, str):
        new_value = str(new_value)

    log_entry = IPAuditLog.objects.create(
        ip_address=ip_address,
        ip_address_str=ip_address_str,
        action=action,
        user=user,
        username=username,
        field_name=field_name,
        old_value=old_value,
        new_value=new_value,
        reason=reason,
        metadata=metadata or {},
        subnet_id=subnet_id,
        subnet_network=subnet_network,
    )

    return log_entry


def get_audit_logs(
    ip_address: Optional[str] = None,
    ip_address_id: Optional[int] = None,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    start_date: Optional[timezone.datetime] = None,
    end_date: Optional[timezone.datetime] = None,
    limit: int = 100,
) -> List[IPAuditLog]:
    """
    Get audit logs with filters.

    Args:
        ip_address: IP address string to filter by
        ip_address_id: IP address ID to filter by
        user_id: User ID to filter by
        action: Action type to filter by
        start_date: Start date for filtering
        end_date: End date for filtering
        limit: Maximum number of results

    Returns:
        List of IPAuditLog instances
    """
    queryset = IPAuditLog.objects.select_related("user", "ip_address").all()

    if ip_address:
        queryset = queryset.filter(ip_address_str=ip_address)
    elif ip_address_id:
        queryset = queryset.filter(ip_address_id=ip_address_id)

    if user_id:
        queryset = queryset.filter(user_id=user_id)

    if action:
        queryset = queryset.filter(action=action)

    if start_date:
        queryset = queryset.filter(created_at__gte=start_date)

    if end_date:
        queryset = queryset.filter(created_at__lte=end_date)

    return list(queryset[:limit])


def get_audit_log_summary(
    ip_address: Optional[str] = None,
    days: int = 30,
) -> Dict:
    """
    Get summary statistics for audit logs.

    Args:
        ip_address: IP address to get summary for (optional)
        days: Number of days to look back

    Returns:
        Dictionary with summary statistics
    """
    from datetime import timedelta

    from django.utils import timezone

    start_date = timezone.now() - timedelta(days=days)

    queryset = IPAuditLog.objects.filter(created_at__gte=start_date)

    if ip_address:
        queryset = queryset.filter(ip_address_str=ip_address)

    total_actions = queryset.count()

    # Count by action type
    action_counts = {}
    for action_code, action_label in IPAuditLog.ACTION_CHOICES:
        count = queryset.filter(action=action_code).count()
        if count > 0:
            action_counts[action_code] = {
                "label": action_label,
                "count": count,
            }

    # Count by user
    from django.db.models import Count

    user_counts = (
        queryset.values("user__username", "username")
        .annotate(count=Count("id"))
        .order_by("-count")[:10]
    )

    # Recent activity
    recent_logs = queryset.order_by("-created_at")[:10]

    return {
        "total_actions": total_actions,
        "period_days": days,
        "start_date": start_date.isoformat(),
        "action_counts": action_counts,
        "top_users": list(user_counts),
        "recent_activity": [
            {
                "id": log.id,
                "ip_address": log.ip_address_str,
                "action": log.action,
                "action_label": log.get_action_display(),
                "user": log.display_user,
                "created_at": log.created_at.isoformat(),
            }
            for log in recent_logs
        ],
    }
