"""
IP Address Audit Log Models for IPAM.

Models for comprehensive audit trail of all IP address changes.
"""

from django.contrib.auth import get_user_model
from django.db import models

from .ip_address import IPAddress

User = get_user_model()


class IPAuditLog(models.Model):
    """
    Model for IP address audit log entries.

    Tracks all changes to IP addresses including creation, updates, assignments,
    status changes, and deletions.
    """

    ACTION_CHOICES = [
        ("created", "Created"),
        ("updated", "Updated"),
        ("deleted", "Deleted"),
        ("assigned", "Assigned"),
        ("released", "Released"),
        ("status_changed", "Status Changed"),
        ("description_changed", "Description Changed"),
        ("subnet_changed", "Subnet Changed"),
        ("tag_added", "Tag Added"),
        ("tag_removed", "Tag Removed"),
        ("note_added", "Note Added"),
        ("note_updated", "Note Updated"),
        ("note_deleted", "Note Deleted"),
    ]

    ip_address = models.ForeignKey(
        IPAddress,
        on_delete=models.CASCADE,
        related_name="audit_logs",
        help_text="IP address this log entry is for",
        null=True,
        blank=True,
    )
    ip_address_str = models.GenericIPAddressField(
        help_text="IP address (stored as string for deleted IPs)",
    )
    action = models.CharField(
        max_length=50,
        choices=ACTION_CHOICES,
        help_text="Action performed",
    )
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ip_audit_logs",
        help_text="User who performed the action",
    )
    username = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        help_text="Username (stored for deleted users)",
    )

    # Change details
    field_name = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Field that was changed (if applicable)",
    )
    old_value = models.TextField(
        blank=True,
        null=True,
        help_text="Previous value (if applicable)",
    )
    new_value = models.TextField(
        blank=True,
        null=True,
        help_text="New value (if applicable)",
    )

    # Additional context
    reason = models.TextField(
        blank=True,
        null=True,
        help_text="Reason/justification for the change",
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional metadata about the change",
    )

    # Timestamps
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the action was performed",
    )

    # IP address context (for deleted IPs)
    subnet_id = models.IntegerField(
        null=True,
        blank=True,
        help_text="Subnet ID (stored for deleted IPs)",
    )
    subnet_network = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Subnet network (stored for deleted IPs)",
    )

    class Meta:
        verbose_name = "IP Audit Log"
        verbose_name_plural = "IP Audit Logs"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["ip_address", "-created_at"]),
            models.Index(fields=["ip_address_str", "-created_at"]),
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["action", "-created_at"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"{self.ip_address_str} - {self.get_action_display()} - {self.created_at}"

    @property
    def display_user(self):
        """Return username or stored username."""
        return self.user.username if self.user else self.username or "System"


class IPAuditLogFilter(models.Model):
    """
    Model for saved audit log filters.

    Allows users to save frequently used filter combinations.
    """

    name = models.CharField(
        max_length=255,
        help_text="Filter name",
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="ip_audit_log_filters",
        help_text="User who created this filter",
    )
    filters = models.JSONField(
        default=dict,
        help_text="Filter parameters (JSON)",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "IP Audit Log Filter"
        verbose_name_plural = "IP Audit Log Filters"
        ordering = ["-updated_at"]
        unique_together = [["user", "name"]]

    def __str__(self):
        return f"{self.user.username} - {self.name}"
