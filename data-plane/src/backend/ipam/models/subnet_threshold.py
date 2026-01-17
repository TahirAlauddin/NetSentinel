"""
Subnet Threshold Models for IPAM.

Models for monitoring subnet utilization thresholds and alerts.
"""

from django.contrib.auth import get_user_model
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from .subnet import Subnet

User = get_user_model()


class SubnetThreshold(models.Model):
    """
    Model for subnet utilization thresholds.

    Defines warning and critical thresholds for subnet utilization.
    """

    subnet = models.OneToOneField(
        Subnet,
        on_delete=models.CASCADE,
        related_name="threshold",
        help_text="Subnet this threshold applies to",
    )

    # Threshold percentages
    warning_threshold = models.IntegerField(
        default=75,
        help_text="Warning threshold percentage (0-100)",
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100),
        ],
    )
    critical_threshold = models.IntegerField(
        default=90,
        help_text="Critical threshold percentage (0-100)",
        validators=[
            MinValueValidator(0),
            MaxValueValidator(100),
        ],
    )

    # Alert settings
    enable_alerts = models.BooleanField(
        default=True,
        help_text="Whether to send alerts when thresholds are exceeded",
    )
    alert_email = models.EmailField(
        blank=True,
        null=True,
        help_text="Email address to send alerts to (if different from subnet owner)",
    )

    # Notification preferences
    notify_on_warning = models.BooleanField(
        default=True,
        help_text="Send notification when warning threshold is reached",
    )
    notify_on_critical = models.BooleanField(
        default=True,
        help_text="Send notification when critical threshold is reached",
    )
    notify_on_recovery = models.BooleanField(
        default=False,
        help_text="Send notification when utilization drops below threshold",
    )

    # Status tracking
    last_checked = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the threshold was last checked",
    )
    last_alert_sent = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the last alert was sent",
    )
    current_status = models.CharField(
        max_length=20,
        choices=[
            ("healthy", "Healthy"),
            ("warning", "Warning"),
            ("critical", "Critical"),
        ],
        default="healthy",
        help_text="Current threshold status",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Subnet Threshold"
        verbose_name_plural = "Subnet Thresholds"
        indexes = [
            models.Index(fields=["subnet", "current_status"]),
            models.Index(fields=["enable_alerts", "current_status"]),
        ]

    def __str__(self):
        return f"{self.subnet.network} - {self.warning_threshold}%/{self.critical_threshold}%"

    def validate_thresholds(self):
        """Validate that warning threshold is less than critical threshold."""
        if self.warning_threshold >= self.critical_threshold:
            raise ValueError("Warning threshold must be less than critical threshold")
        return True

    def save(self, *args, **kwargs):
        """Validate thresholds before saving."""
        self.validate_thresholds()
        super().save(*args, **kwargs)


class SubnetThresholdAlert(models.Model):
    """
    Model for subnet threshold alerts.

    Tracks when thresholds are exceeded and alerts are sent.
    """

    threshold = models.ForeignKey(
        SubnetThreshold,
        on_delete=models.CASCADE,
        related_name="alerts",
        help_text="Threshold that triggered this alert",
    )
    alert_type = models.CharField(
        max_length=20,
        choices=[
            ("warning", "Warning"),
            ("critical", "Critical"),
            ("recovery", "Recovery"),
        ],
        help_text="Type of alert",
    )
    utilization_percentage = models.FloatField(
        help_text="Utilization percentage when alert was triggered",
    )
    message = models.TextField(
        help_text="Alert message",
    )
    sent_to = models.EmailField(
        blank=True,
        null=True,
        help_text="Email address alert was sent to",
    )
    sent_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the alert was sent",
    )
    acknowledged = models.BooleanField(
        default=False,
        help_text="Whether the alert has been acknowledged",
    )
    acknowledged_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="acknowledged_threshold_alerts",
        help_text="User who acknowledged the alert",
    )
    acknowledged_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the alert was acknowledged",
    )

    class Meta:
        verbose_name = "Subnet Threshold Alert"
        verbose_name_plural = "Subnet Threshold Alerts"
        ordering = ["-sent_at"]
        indexes = [
            models.Index(fields=["threshold", "-sent_at"]),
            models.Index(fields=["alert_type", "-sent_at"]),
            models.Index(fields=["acknowledged", "-sent_at"]),
        ]

    def __str__(self):
        return f"{self.threshold.subnet.network} - {self.get_alert_type_display()} - {self.sent_at}"
