from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone

from .ip_address import IPAddress
from .subnet import Subnet

User = get_user_model()


class IPRequest(models.Model):
    """
    Model for IP address reservation requests with approval workflow.

    Users can request IP addresses, which go through an approval process.
    Once approved, the IP address is automatically created/updated with reserved status.
    """

    STATUS_CHOICES = [
        ("pending", "Pending"),  # Awaiting approval
        ("approved", "Approved"),  # Approved, IP will be reserved
        ("rejected", "Rejected"),  # Request rejected
        ("expired", "Expired"),  # Request expired
        ("completed", "Completed"),  # IP address has been assigned/reserved
    ]

    # Request details
    requested_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="ip_requests",
        help_text="User who requested the IP address",
    )
    subnet = models.ForeignKey(
        Subnet,
        on_delete=models.CASCADE,
        related_name="ip_requests",
        help_text="Subnet to request IP from",
    )
    requested_ip = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="Specific IP address requested (optional, leave blank for auto-assignment)",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
        help_text="Request status",
    )

    # Request information
    purpose = models.TextField(
        help_text="Purpose/reason for requesting this IP address",
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Additional description or notes",
    )

    # Approval workflow
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_ip_requests",
        help_text="User who approved/rejected this request",
    )
    approval_notes = models.TextField(
        blank=True,
        null=True,
        help_text="Notes from approver",
    )
    approved_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the request was approved/rejected",
    )

    # Reservation details
    reservation_expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the reservation expires (optional)",
    )
    ip_address = models.ForeignKey(
        IPAddress,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ip_requests",
        help_text="IP address created/updated when request is approved",
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "IP Request"
        verbose_name_plural = "IP Requests"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["requested_by", "-created_at"]),
            models.Index(fields=["subnet", "status"]),
        ]

    def __str__(self):
        ip_display = self.requested_ip or "Auto"
        return f"{self.requested_by.username} - {ip_display} ({self.get_status_display()})"

    def is_expired(self):
        """Check if the reservation has expired."""
        if self.reservation_expires_at and self.status in ("approved", "completed"):
            return timezone.now() > self.reservation_expires_at
        return False

    def can_be_approved(self):
        """Check if the request can be approved."""
        return self.status == "pending"

    def can_be_rejected(self):
        """Check if the request can be rejected."""
        return self.status == "pending"
