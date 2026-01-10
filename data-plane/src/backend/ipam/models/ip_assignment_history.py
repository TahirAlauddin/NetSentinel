from django.contrib.auth import get_user_model
from django.db import models

from .ip_address import IPAddress

User = get_user_model()


class IPAssignmentHistory(models.Model):
    """
    Model to track IP address assignment history.
    
    Records all changes to IP address assignments including:
    - Initial assignments
    - Reassignments
    - Releases
    - Status changes
    """

    ACTION_CHOICES = [
        ("assigned", "Assigned"),  # IP assigned to asset
        ("reassigned", "Reassigned"),  # IP reassigned to different asset
        ("released", "Released"),  # IP released from asset
        ("status_changed", "Status Changed"),  # IP status changed
        ("reserved", "Reserved"),  # IP reserved
        ("deprecated", "Deprecated"),  # IP deprecated
    ]

    ip_address = models.ForeignKey(
        IPAddress,
        on_delete=models.CASCADE,
        related_name="assignment_history",
        help_text="IP address this history entry belongs to",
    )
    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        help_text="Action performed",
    )
    
    # Assignment details
    assigned_to_asset = models.ForeignKey(
        "assets.Asset",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ip_assignment_history",
        help_text="Asset this IP was assigned to (if applicable)",
    )
    previous_asset = models.ForeignKey(
        "assets.Asset",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="previous_ip_assignments",
        help_text="Previous asset (for reassignments)",
    )
    
    # Status tracking
    previous_status = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Previous IP address status",
    )
    new_status = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="New IP address status",
    )
    
    # User tracking
    performed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ip_assignment_actions",
        help_text="User who performed this action",
    )
    
    # Notes
    reason = models.TextField(
        blank=True,
        null=True,
        help_text="Reason for this assignment/change",
    )
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Additional notes",
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "IP Assignment History"
        verbose_name_plural = "IP Assignment Histories"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["ip_address", "-created_at"]),
            models.Index(fields=["assigned_to_asset", "-created_at"]),
            models.Index(fields=["action", "-created_at"]),
        ]

    def __str__(self):
        asset_name = self.assigned_to_asset.name if self.assigned_to_asset else "None"
        return f"{self.ip_address.address} - {self.get_action_display()} - {asset_name}"
