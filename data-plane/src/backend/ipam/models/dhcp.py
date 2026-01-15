"""
DHCP Models for IPAM.

Models for DHCP scope management, lease tracking, and reservations.
"""

from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone

from .subnet import Subnet

User = get_user_model()


class DHCPScope(models.Model):
    """
    Model for DHCP scopes/pools.

    Represents a DHCP scope that can be used for automatic IP assignment.
    """

    subnet = models.ForeignKey(
        Subnet,
        on_delete=models.CASCADE,
        related_name="dhcp_scopes",
        help_text="Subnet this DHCP scope belongs to",
    )
    name = models.CharField(
        max_length=255,
        help_text="DHCP scope name",
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Scope description",
    )

    # Scope configuration
    start_ip = models.GenericIPAddressField(
        help_text="Starting IP address for the scope",
    )
    end_ip = models.GenericIPAddressField(
        help_text="Ending IP address for the scope",
    )
    subnet_mask = models.GenericIPAddressField(
        help_text="Subnet mask for the scope",
    )
    gateway = models.GenericIPAddressField(
        blank=True,
        null=True,
        help_text="Default gateway",
    )
    dns_servers = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="DNS servers (comma-separated)",
    )

    # Lease configuration
    lease_duration = models.IntegerField(
        default=86400,
        help_text="Lease duration in seconds (default: 24 hours)",
    )
    max_leases = models.IntegerField(
        null=True,
        blank=True,
        help_text="Maximum number of leases (null = unlimited)",
    )

    # Status
    is_active = models.BooleanField(
        default=True,
        help_text="Whether the scope is active",
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "DHCP Scope"
        verbose_name_plural = "DHCP Scopes"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["subnet", "is_active"]),
            models.Index(fields=["start_ip", "end_ip"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.start_ip} - {self.end_ip})"

    def get_available_ips(self):
        """Get count of available IPs in the scope."""
        from ..services.dhcp import calculate_scope_availability

        return calculate_scope_availability(self.id)


class DHCPLease(models.Model):
    """
    Model for DHCP leases.

    Tracks active and historical DHCP leases.
    """

    STATUS_CHOICES = [
        ("active", "Active"),
        ("expired", "Expired"),
        ("released", "Released"),
        ("declined", "Declined"),
    ]

    scope = models.ForeignKey(
        DHCPScope,
        on_delete=models.CASCADE,
        related_name="leases",
        help_text="DHCP scope this lease belongs to",
    )
    ip_address = models.GenericIPAddressField(
        help_text="Leased IP address",
    )
    mac_address = models.CharField(
        max_length=17,
        help_text="MAC address of the client",
    )
    hostname = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Client hostname",
    )

    # Lease information
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active",
        help_text="Lease status",
    )
    lease_start = models.DateTimeField(
        help_text="When the lease started",
    )
    lease_end = models.DateTimeField(
        help_text="When the lease expires",
    )
    lease_renewal = models.DateTimeField(
        blank=True,
        null=True,
        help_text="When the lease was last renewed",
    )

    # Additional information
    client_identifier = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="DHCP client identifier",
    )
    vendor_class = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="DHCP vendor class",
    )
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Additional notes",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "DHCP Lease"
        verbose_name_plural = "DHCP Leases"
        ordering = ["-lease_start"]
        indexes = [
            models.Index(fields=["scope", "status", "-lease_end"]),
            models.Index(fields=["ip_address", "status"]),
            models.Index(fields=["mac_address", "status"]),
        ]
        unique_together = [["scope", "ip_address", "mac_address"]]

    def __str__(self):
        return f"{self.ip_address} - {self.mac_address} ({self.get_status_display()})"

    @property
    def is_expired(self):
        """Check if the lease has expired."""
        return self.lease_end < timezone.now() and self.status == "active"

    @property
    def time_remaining(self):
        """Get time remaining on lease in seconds."""
        if self.status == "active" and self.lease_end > timezone.now():
            return (self.lease_end - timezone.now()).total_seconds()
        return 0


class DHCPReservation(models.Model):
    """
    Model for DHCP reservations.

    Represents a reserved IP address that will always be assigned to a specific MAC address.
    """

    scope = models.ForeignKey(
        DHCPScope,
        on_delete=models.CASCADE,
        related_name="reservations",
        help_text="DHCP scope this reservation belongs to",
    )
    ip_address = models.GenericIPAddressField(
        help_text="Reserved IP address",
    )
    mac_address = models.CharField(
        max_length=17,
        help_text="MAC address to reserve the IP for",
    )
    hostname = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Hostname for the reservation",
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Reservation description",
    )

    # Status
    is_active = models.BooleanField(
        default=True,
        help_text="Whether the reservation is active",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "DHCP Reservation"
        verbose_name_plural = "DHCP Reservations"
        ordering = ["ip_address"]
        indexes = [
            models.Index(fields=["scope", "is_active"]),
            models.Index(fields=["mac_address", "is_active"]),
        ]
        unique_together = [["scope", "ip_address"], ["scope", "mac_address"]]

    def __str__(self):
        return f"{self.ip_address} -> {self.mac_address}"
