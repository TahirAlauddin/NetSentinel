from django.db import models

from .subnet import Subnet


class IPAddress(models.Model):
    """
    IP Address model for individual IP address management.
    """

    STATUS_CHOICES = [
        ("available", "Available"), # unused, available, free
        ("reserved", "Reserved"), # reserved, allocated
        ("assigned", "Assigned"), # used, active, assigned
        ("dhcp", "DHCP"), # dhcp, dynamic
        ("deprecated", "Deprecated"), # deprecated, retired
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
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "IP Address"
        verbose_name_plural = "IP Addresses"
        ordering = ["address"]

    def __str__(self):
        return self.address
