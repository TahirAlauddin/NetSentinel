"""
Subnet Threshold Monitoring Service.

Provides functions for checking subnet utilization against thresholds and sending alerts.
"""

from typing import Dict, Optional

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from ..models import Subnet, SubnetThreshold, SubnetThresholdAlert
from ..services.subnet_utilization import calculate_subnet_utilization


def check_subnet_threshold(subnet_id: int) -> Dict:
    """
    Check subnet utilization against thresholds.

    Args:
        subnet_id: Subnet ID to check

    Returns:
        Dictionary with threshold check results
    """
    try:
        subnet = Subnet.objects.get(id=subnet_id)
    except Subnet.DoesNotExist:
        return {
            "error": f"Subnet {subnet_id} not found",
        }

    # Get or create threshold
    threshold, created = SubnetThreshold.objects.get_or_create(
        subnet=subnet,
        defaults={
            "warning_threshold": 75,
            "critical_threshold": 90,
        },
    )

    # Calculate utilization
    utilization = calculate_subnet_utilization(subnet)
    utilization_percentage = utilization.get("utilization_percentage", 0)

    # Determine status
    previous_status = threshold.current_status
    if utilization_percentage >= threshold.critical_threshold:
        new_status = "critical"
    elif utilization_percentage >= threshold.warning_threshold:
        new_status = "warning"
    else:
        new_status = "healthy"

    # Update threshold
    threshold.current_status = new_status
    threshold.last_checked = timezone.now()
    threshold.save()

    # Check if alert should be sent
    alert_sent = False
    alert_type = None

    if threshold.enable_alerts:
        # Check for warning
        if new_status == "warning" and threshold.notify_on_warning and previous_status != "warning":
            alert_sent = send_threshold_alert(threshold, "warning", utilization_percentage)
            alert_type = "warning"

        # Check for critical
        elif (
            new_status == "critical"
            and threshold.notify_on_critical
            and previous_status != "critical"
        ):
            alert_sent = send_threshold_alert(threshold, "critical", utilization_percentage)
            alert_type = "critical"

        # Check for recovery
        elif (
            new_status == "healthy"
            and threshold.notify_on_recovery
            and previous_status != "healthy"
        ):
            alert_sent = send_threshold_alert(threshold, "recovery", utilization_percentage)
            alert_type = "recovery"

    return {
        "subnet_id": subnet_id,
        "subnet_network": subnet.network,
        "utilization_percentage": utilization_percentage,
        "warning_threshold": threshold.warning_threshold,
        "critical_threshold": threshold.critical_threshold,
        "previous_status": previous_status,
        "current_status": new_status,
        "alert_sent": alert_sent,
        "alert_type": alert_type,
        "last_checked": threshold.last_checked.isoformat() if threshold.last_checked else None,
    }


def send_threshold_alert(
    threshold: SubnetThreshold,
    alert_type: str,
    utilization_percentage: float,
) -> bool:
    """
    Send a threshold alert.

    Args:
        threshold: SubnetThreshold instance
        alert_type: Type of alert (warning, critical, recovery)
        utilization_percentage: Current utilization percentage

    Returns:
        True if alert was sent successfully
    """
    # Determine recipient
    recipient = threshold.alert_email
    if not recipient:
        # Try to get from subnet customer
        if threshold.subnet.customer and threshold.subnet.customer.email:
            recipient = threshold.subnet.customer.email
        else:
            # Use default from settings
            recipient = getattr(settings, "DEFAULT_FROM_EMAIL", None)

    if not recipient:
        return False

    # Create alert message
    if alert_type == "warning":
        subnet_network = threshold.subnet.network
        subject = (
            f"Warning: Subnet {subnet_network} utilization at " f"{utilization_percentage:.1f}%"
        )
        message = f"""
Subnet {threshold.subnet.network} has reached the warning threshold.

Current Utilization: {utilization_percentage:.1f}%
Warning Threshold: {threshold.warning_threshold}%
Critical Threshold: {threshold.critical_threshold}%

Please review the subnet utilization and consider expanding the subnet
or releasing unused IP addresses.
"""
    elif alert_type == "critical":
        subnet_network = threshold.subnet.network
        subject = (
            f"CRITICAL: Subnet {subnet_network} utilization at " f"{utilization_percentage:.1f}%"
        )
        message = f"""
URGENT: Subnet {threshold.subnet.network} has reached the critical threshold!

Current Utilization: {utilization_percentage:.1f}%
Warning Threshold: {threshold.warning_threshold}%
Critical Threshold: {threshold.critical_threshold}%

Immediate action required. The subnet is nearly full and may run out of available IP addresses soon.
"""
    else:  # recovery
        subject = f"Recovery: Subnet {threshold.subnet.network} utilization back to healthy"
        message = f"""
Subnet {threshold.subnet.network} utilization has dropped below the warning threshold.

Current Utilization: {utilization_percentage:.1f}%
Warning Threshold: {threshold.warning_threshold}%
Critical Threshold: {threshold.critical_threshold}%

The subnet is now operating within normal utilization levels.
"""

    # Send email
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@netsentinel.local"),
            recipient_list=[recipient],
            fail_silently=False,
        )

        # Create alert record
        SubnetThresholdAlert.objects.create(
            threshold=threshold,
            alert_type=alert_type,
            utilization_percentage=utilization_percentage,
            message=message,
            sent_to=recipient,
        )

        # Update threshold
        threshold.last_alert_sent = timezone.now()
        threshold.save()

        # Send to Slack/Discord if configured (system-wide config, no user)
        try:
            from notifications.models import InAppNotification
            from notifications.services import send_notification

            # Global in-app notification
            InAppNotification.objects.create(
                title=subject,
                message=message.strip(),
                type="critical" if alert_type == "critical" else "warning" if alert_type == "warning" else "success",
                # Could later add a deep link into the UI, e.g. subnet detail page
            )

            # External channels (Slack/Discord)
            send_notification(
                title=subject,
                message=message.strip(),
                alert_type="critical" if alert_type == "critical" else "warning" if alert_type == "warning" else "recovery",
                user=None,
            )
        except Exception as e:
            print(f"Notification channels (in-app/Slack/Discord) failed: {e}")

        return True
    except Exception as e:
        # Log error but don't fail
        print(f"Error sending threshold alert: {e}")
        return False


def check_all_thresholds() -> Dict:
    """
    Check all subnet thresholds.

    Returns:
        Dictionary with summary of all threshold checks
    """
    thresholds = SubnetThreshold.objects.filter(enable_alerts=True).select_related("subnet")

    results = {
        "total_checked": 0,
        "warnings": 0,
        "criticals": 0,
        "healthy": 0,
        "alerts_sent": 0,
        "details": [],
    }

    for threshold in thresholds:
        result = check_subnet_threshold(threshold.subnet.id)
        results["total_checked"] += 1

        if result.get("current_status") == "warning":
            results["warnings"] += 1
        elif result.get("current_status") == "critical":
            results["criticals"] += 1
        else:
            results["healthy"] += 1

        if result.get("alert_sent"):
            results["alerts_sent"] += 1

        results["details"].append(result)

    return results


def get_threshold_summary(subnet_id: Optional[int] = None) -> Dict:
    """
    Get summary of threshold statuses.

    Args:
        subnet_id: Optional subnet ID to filter by

    Returns:
        Dictionary with threshold summary
    """
    queryset = SubnetThreshold.objects.select_related("subnet").all()

    if subnet_id:
        queryset = queryset.filter(subnet_id=subnet_id)

    total = queryset.count()
    healthy = queryset.filter(current_status="healthy").count()
    warning = queryset.filter(current_status="warning").count()
    critical = queryset.filter(current_status="critical").count()

    return {
        "total": total,
        "healthy": healthy,
        "warning": warning,
        "critical": critical,
        "by_status": {
            "healthy": healthy,
            "warning": warning,
            "critical": critical,
        },
    }
