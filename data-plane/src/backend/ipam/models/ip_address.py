from django.contrib.auth import get_user_model
from django.db import models

from .subnet import Subnet

User = get_user_model()


class IPAddress(models.Model):
    """
    IP Address model for individual IP address management.
    """

    STATUS_CHOICES = [
        ("available", "Available"),  # unused, available, free
        ("reserved", "Reserved"),  # reserved, allocated
        ("assigned", "Assigned"),  # used, active, assigned
        ("dhcp", "DHCP"),  # dhcp, dynamic
        ("deprecated", "Deprecated"),  # deprecated, retired
    ]

    address = models.GenericIPAddressField(
        unique=True,
        help_text="IP address (IPv4 or IPv6)",
    )
    subnet = models.ForeignKey(
        Subnet,
        on_delete=models.CASCADE,
        related_name="ip_addresses",
        help_text="Subnet this IP address belongs to",
        null=True,
        blank=True,
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="available",
        help_text="IP address status",
    )
    description = models.TextField(blank=True, null=True)
    
    # Asset assignment
    assigned_to_asset = models.ForeignKey(
        "assets.Asset",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_ip_addresses",
        help_text="Asset/device this IP address is assigned to",
    )
    assigned_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_ip_addresses",
        help_text="User who assigned this IP address",
    )
    assigned_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this IP address was assigned",
    )
    
    # Tags (many-to-many through IPAddressTag)
    tags = models.ManyToManyField(
        "ipam.IPTag",
        through="ipam.IPAddressTag",
        related_name="ip_addresses",
        blank=True,
        help_text="Tags applied to this IP address",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "IP Address"
        verbose_name_plural = "IP Addresses"
        ordering = ["address"]
        indexes = [
            models.Index(fields=["status", "subnet"]),
            models.Index(fields=["assigned_to_asset"]),
        ]

    def __str__(self):
        return self.address
