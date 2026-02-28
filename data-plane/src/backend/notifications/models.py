"""
Notification delivery configuration.

Stores webhook URLs and enabled flags for Slack, Discord, etc.
Config can be system-wide (user=None) or per-user (user set).
"""

from django.conf import settings
from django.db import models


class NotificationConfig(models.Model):
    """
    Configuration for where to send notifications (Slack, Discord, etc.).
    One row per scope: system-wide (user=None) or per-user (user set).
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notification_config",
        help_text="If null, this is the system-wide default config.",
    )

    # Slack
    slack_enabled = models.BooleanField(default=False)
    slack_webhook_url = models.URLField(max_length=2000, blank=True)
    slack_default_channel = models.CharField(max_length=255, blank=True)

    # Discord
    discord_enabled = models.BooleanField(default=False)
    discord_webhook_url = models.URLField(max_length=2000, blank=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Notification config"
        verbose_name_plural = "Notification configs"

    def __str__(self):
        if self.user_id:
            return f"Notification config for {self.user}"
        return "System notification config"


class InAppNotification(models.Model):
    """
    Global in-app notification.

    Not scoped to a particular user – every notification is tracked
    once and can be shown to all users in the UI.
    """

    TYPE_CHOICES = [
        ("info", "Info"),
        ("warning", "Warning"),
        ("error", "Error"),
        ("success", "Success"),
    ]

    # Optional: which user this notification is most relevant to.
    # Kept nullable so we can still have global notifications.
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="in_app_notifications",
    )

    title = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="info")
    link = models.URLField(max_length=2000, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "In-app notification"
        verbose_name_plural = "In-app notifications"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.type.upper()}: {self.title}"


class NotificationReadReceipt(models.Model):
    """
    Tracks which user has read which in-app notification.
    Used for bell (unread only) and view-all (unread), and history (read flag).
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notification_read_receipts",
    )
    notification = models.ForeignKey(
        InAppNotification,
        on_delete=models.CASCADE,
        related_name="read_receipts",
    )
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Notification read receipt"
        verbose_name_plural = "Notification read receipts"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "notification"],
                name="notifications_readreceipt_user_notification_unique",
            )
        ]

    def __str__(self) -> str:
        return f"{self.user} read {self.notification_id}"
