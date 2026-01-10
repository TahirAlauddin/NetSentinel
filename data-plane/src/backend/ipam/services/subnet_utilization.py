"""
Subnet Utilization Analytics Service

Provides functions for calculating subnet utilization, capacity planning,
and growth trend analysis.
"""

import ipaddress
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Optional

from django.db.models import Count, Q
from django.utils import timezone

from ..models import Subnet, IPAddress


def calculate_subnet_utilization(subnet: Subnet) -> Dict:
    """
    Calculate utilization statistics for a subnet.

    Args:
        subnet: Subnet instance

    Returns:
        Dictionary containing utilization metrics:
        - total_hosts: Total number of host addresses
        - usable_hosts: Number of usable host addresses (excluding network/broadcast)
        - used_ips: Number of IPs with non-available status
        - reserved_ips: Number of reserved IPs
        - assigned_ips: Number of assigned IPs
        - available_ips: Number of available IPs
        - utilization_percentage: Percentage of subnet in use
        - available_percentage: Percentage of subnet available
    """
    try:
        net = ipaddress.ip_network(subnet.network, strict=False)
        is_ipv6 = isinstance(net, ipaddress.IPv6Network)
        
        # Calculate total hosts
        total_hosts = net.num_addresses
        
        # For IPv4, exclude network and broadcast addresses
        if is_ipv6:
            usable_hosts = total_hosts
        else:
            usable_hosts = max(0, total_hosts - 2)  # Exclude network and broadcast
        
        # Get IP address counts by status
        ip_counts = IPAddress.objects.filter(subnet=subnet).aggregate(
            total=Count("id"),
            available=Count("id", filter=Q(status="available")),
            reserved=Count("id", filter=Q(status="reserved")),
            assigned=Count("id", filter=Q(status="assigned")),
            dhcp=Count("id", filter=Q(status="dhcp")),
            deprecated=Count("id", filter=Q(status="deprecated")),
        )
        
        used_ips = ip_counts["total"] - (ip_counts["available"] or 0)
        available_ips = usable_hosts - used_ips if used_ips <= usable_hosts else 0
        
        # Calculate percentages
        if usable_hosts > 0:
            utilization_percentage = round((used_ips / usable_hosts) * 100, 2)
            available_percentage = round((available_ips / usable_hosts) * 100, 2)
        else:
            utilization_percentage = 0.0
            available_percentage = 0.0
        
        return {
            "subnet_id": subnet.id,
            "subnet_network": subnet.network,
            "is_ipv6": is_ipv6,
            "total_hosts": total_hosts,
            "usable_hosts": usable_hosts,
            "used_ips": used_ips,
            "available_ips": max(0, available_ips),
            "reserved_ips": ip_counts["reserved"] or 0,
            "assigned_ips": ip_counts["assigned"] or 0,
            "dhcp_ips": ip_counts["dhcp"] or 0,
            "deprecated_ips": ip_counts["deprecated"] or 0,
            "utilization_percentage": utilization_percentage,
            "available_percentage": available_percentage,
            "status": _get_utilization_status(utilization_percentage),
        }
    except (ValueError, AttributeError) as e:
        return {
            "error": f"Invalid subnet: {str(e)}",
            "subnet_id": subnet.id if subnet else None,
        }


def _get_utilization_status(percentage: float) -> str:
    """Get utilization status based on percentage."""
    if percentage >= 90:
        return "critical"
    elif percentage >= 75:
        return "warning"
    elif percentage >= 50:
        return "moderate"
    else:
        return "healthy"


def calculate_subnet_capacity(subnet: Subnet, growth_rate: float = 0.0, months: int = 12) -> Dict:
    """
    Calculate capacity planning metrics for a subnet.

    Args:
        subnet: Subnet instance
        growth_rate: Monthly growth rate (as decimal, e.g., 0.05 for 5%)
        months: Number of months to project

    Returns:
        Dictionary containing capacity planning data
    """
    utilization = calculate_subnet_utilization(subnet)
    
    if "error" in utilization:
        return utilization
    
    current_used = utilization["used_ips"]
    usable_hosts = utilization["usable_hosts"]
    
    # Calculate projected usage
    projected_used = []
    for month in range(1, months + 1):
        projected = current_used * ((1 + growth_rate) ** month)
        projected_used.append({
            "month": month,
            "projected_used": round(projected, 2),
            "projected_available": max(0, usable_hosts - projected),
            "projected_utilization": round((projected / usable_hosts) * 100, 2) if usable_hosts > 0 else 0,
        })
    
    # Find when subnet will be full (if growth rate > 0)
    months_until_full = None
    if growth_rate > 0 and current_used < usable_hosts:
        for month_data in projected_used:
            if month_data["projected_used"] >= usable_hosts:
                months_until_full = month_data["month"]
                break
    
    return {
        **utilization,
        "growth_rate": growth_rate,
        "projection_months": months,
        "projected_usage": projected_used,
        "months_until_full": months_until_full,
        "capacity_warning": months_until_full is not None and months_until_full <= 6,
    }


def get_subnet_utilization_trends(
    subnet: Subnet,
    days: int = 30,
    interval: str = "day"
) -> List[Dict]:
    """
    Get utilization trends over time for a subnet.

    Note: This is a simplified version. For full implementation,
    you would need to store historical snapshots of utilization.

    Args:
        subnet: Subnet instance
        days: Number of days to look back
        interval: Interval type ("day", "week", "month")

    Returns:
        List of utilization data points
    """
    # For now, return current utilization
    # In a full implementation, you would query historical data
    current = calculate_subnet_utilization(subnet)
    
    if "error" in current:
        return []
    
    # Generate trend data (simplified - would need historical snapshots)
    trends = []
    end_date = timezone.now()
    
    for i in range(days):
        date = end_date - timedelta(days=i)
        trends.append({
            "date": date.isoformat(),
            "used_ips": current["used_ips"],  # Would be from historical data
            "utilization_percentage": current["utilization_percentage"],
        })
    
    return trends


def get_all_subnets_utilization(
    filters: Optional[Dict] = None,
    threshold: Optional[float] = None
) -> List[Dict]:
    """
    Get utilization for all subnets, optionally filtered.

    Args:
        filters: Optional filters (location, group, status, etc.)
        threshold: Optional minimum utilization percentage to include

    Returns:
        List of utilization dictionaries
    """
    queryset = Subnet.objects.all()
    
    if filters:
        if "location" in filters:
            queryset = queryset.filter(location_id=filters["location"])
        if "group" in filters:
            queryset = queryset.filter(group_id=filters["group"])
        if "status" in filters:
            queryset = queryset.filter(status=filters["status"])
        if "is_ipv6" in filters:
            queryset = queryset.filter(is_ipv6=filters["is_ipv6"])
    
    utilizations = []
    for subnet in queryset:
        utilization = calculate_subnet_utilization(subnet)
        if "error" not in utilization:
            if threshold is None or utilization["utilization_percentage"] >= threshold:
                utilizations.append(utilization)
    
    # Sort by utilization percentage (descending)
    utilizations.sort(key=lambda x: x["utilization_percentage"], reverse=True)
    
    return utilizations


def get_utilization_summary() -> Dict:
    """
    Get overall utilization summary across all subnets.

    Returns:
        Dictionary with summary statistics
    """
    subnets = Subnet.objects.all()
    total_subnets = subnets.count()
    
    utilizations = [calculate_subnet_utilization(s) for s in subnets]
    valid_utilizations = [u for u in utilizations if "error" not in u]
    
    if not valid_utilizations:
        return {
            "total_subnets": total_subnets,
            "error": "No valid subnets found",
        }
    
    total_usable = sum(u["usable_hosts"] for u in valid_utilizations)
    total_used = sum(u["used_ips"] for u in valid_utilizations)
    total_available = sum(u["available_ips"] for u in valid_utilizations)
    
    overall_utilization = (
        (total_used / total_usable * 100) if total_usable > 0 else 0
    )
    
    # Count by status
    critical_count = sum(1 for u in valid_utilizations if u["status"] == "critical")
    warning_count = sum(1 for u in valid_utilizations if u["status"] == "warning")
    moderate_count = sum(1 for u in valid_utilizations if u["status"] == "moderate")
    healthy_count = sum(1 for u in valid_utilizations if u["status"] == "healthy")
    
    return {
        "total_subnets": total_subnets,
        "total_usable_hosts": total_usable,
        "total_used_ips": total_used,
        "total_available_ips": total_available,
        "overall_utilization_percentage": round(overall_utilization, 2),
        "subnets_by_status": {
            "critical": critical_count,
            "warning": warning_count,
            "moderate": moderate_count,
            "healthy": healthy_count,
        },
        "status": _get_utilization_status(overall_utilization),
    }
