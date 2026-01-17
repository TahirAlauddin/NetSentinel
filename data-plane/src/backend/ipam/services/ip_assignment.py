"""
IP Address Assignment Service

Provides functions for managing IP address assignments to assets/devices.
Includes automatic assignment, reassignment, and history tracking.
"""

from django.contrib.auth import get_user_model
from django.utils import timezone

from ..models import IPAddress, IPAssignmentHistory

User = get_user_model()


def assign_ip_to_asset(
    ip_address: IPAddress,
    asset,
    assigned_by: User,
    reason: str = None,
    notes: str = None,
    auto_assign: bool = False,
) -> IPAssignmentHistory:
    """
    Assign an IP address to an asset/device.

    Args:
        ip_address: IPAddress instance to assign
        asset: Asset instance to assign to
        assigned_by: User performing the assignment
        reason: Reason for assignment
        notes: Additional notes
        auto_assign: Whether this is an automatic assignment

    Returns:
        IPAssignmentHistory entry

    Raises:
        ValueError: If IP address is not available for assignment
    """
    # Check if IP is already assigned to an asset
    if ip_address.assigned_to_asset is not None:
        # Allow reassignment if already assigned (handled below)
        pass
    elif ip_address.status == "assigned":
        # Status is "assigned" but no asset assigned - not available for new assignment
        raise ValueError(
            f"IP address {ip_address.address} is not available for assignment "
            f"(current status: {ip_address.get_status_display()})"
        )
    elif ip_address.status not in ("available", "reserved"):
        # Other statuses are not available
        raise ValueError(
            f"IP address {ip_address.address} is not available for assignment "
            f"(current status: {ip_address.get_status_display()})"
        )

    # Store previous state
    previous_asset = ip_address.assigned_to_asset
    previous_status = ip_address.status

    # Update IP address
    ip_address.assigned_to_asset = asset
    ip_address.assigned_by = assigned_by
    ip_address.assigned_at = timezone.now()
    ip_address.status = "assigned"
    ip_address.save()

    # Create history entry
    action = "assigned" if not previous_asset else "reassigned"
    history = IPAssignmentHistory.objects.create(
        ip_address=ip_address,
        action=action,
        assigned_to_asset=asset,
        previous_asset=previous_asset,
        previous_status=previous_status,
        new_status="assigned",
        performed_by=assigned_by,
        reason=reason,
        notes=notes,
    )

    return history


def release_ip_from_asset(
    ip_address: IPAddress,
    released_by: User,
    reason: str = None,
    notes: str = None,
    new_status: str = "available",
) -> IPAssignmentHistory:
    """
    Release an IP address from its current asset assignment.

    Args:
        ip_address: IPAddress instance to release
        released_by: User performing the release
        reason: Reason for release
        notes: Additional notes
        new_status: Status to set after release (default: "available")

    Returns:
        IPAssignmentHistory entry

    Raises:
        ValueError: If IP address is not currently assigned
    """
    if not ip_address.assigned_to_asset:
        raise ValueError(f"IP address {ip_address.address} is not currently assigned to any asset")

    if new_status not in ("available", "reserved", "deprecated"):
        raise ValueError(f"Invalid status for released IP: {new_status}")

    # Store previous state
    previous_asset = ip_address.assigned_to_asset
    previous_status = ip_address.status

    # Update IP address
    ip_address.assigned_to_asset = None
    ip_address.assigned_by = None
    ip_address.assigned_at = None
    ip_address.status = new_status
    ip_address.save()

    # Create history entry
    history = IPAssignmentHistory.objects.create(
        ip_address=ip_address,
        action="released",
        previous_asset=previous_asset,
        previous_status=previous_status,
        new_status=new_status,
        performed_by=released_by,
        reason=reason,
        notes=notes,
    )

    return history


def auto_assign_ip_from_subnet(
    subnet,
    asset,
    assigned_by: User,
    reason: str = None,
    notes: str = None,
) -> tuple[IPAddress, IPAssignmentHistory]:
    """
    Automatically assign the next available IP address from a subnet to an asset.

    Args:
        subnet: Subnet instance to assign from
        asset: Asset instance to assign to
        assigned_by: User performing the assignment
        reason: Reason for assignment
        notes: Additional notes

    Returns:
        Tuple of (IPAddress, IPAssignmentHistory)

    Raises:
        ValueError: If no available IP addresses in subnet
    """
    from ..services.subnet_utils import get_next_available_ip

    # Get used IPs in subnet
    used_ips = list(
        IPAddress.objects.filter(subnet=subnet)
        .exclude(status="available")
        .values_list("address", flat=True)
    )

    # Find next available IP
    next_ip = get_next_available_ip(subnet.network, used_ips)
    if not next_ip:
        raise ValueError(f"No available IP addresses in subnet {subnet.network}")

    # Get or create IP address
    ip_address, created = IPAddress.objects.get_or_create(
        address=next_ip,
        defaults={
            "subnet": subnet,
            "status": "available",
        },
    )

    if not created and ip_address.status != "available":
        raise ValueError(f"IP address {next_ip} is not available")

    # Assign to asset
    history = assign_ip_to_asset(
        ip_address=ip_address,
        asset=asset,
        assigned_by=assigned_by,
        reason=reason or "Automatic assignment from subnet",
        notes=notes,
        auto_assign=True,
    )

    return ip_address, history


def change_ip_status(
    ip_address: IPAddress,
    new_status: str,
    changed_by: User,
    reason: str = None,
    notes: str = None,
) -> IPAssignmentHistory:
    """
    Change the status of an IP address.

    Args:
        ip_address: IPAddress instance
        new_status: New status to set
        changed_by: User performing the change
        reason: Reason for status change
        notes: Additional notes

    Returns:
        IPAssignmentHistory entry

    Raises:
        ValueError: If new_status is invalid
    """
    valid_statuses = [choice[0] for choice in IPAddress.STATUS_CHOICES]
    if new_status not in valid_statuses:
        raise ValueError(f"Invalid status: {new_status}")

    previous_status = ip_address.status

    # Update IP address
    ip_address.status = new_status
    ip_address.save()

    # Create history entry
    history = IPAssignmentHistory.objects.create(
        ip_address=ip_address,
        action="status_changed",
        previous_status=previous_status,
        new_status=new_status,
        performed_by=changed_by,
        reason=reason,
        notes=notes,
    )

    return history
