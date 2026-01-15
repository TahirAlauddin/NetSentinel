"""
IP Address Pool Models for IPAM.

Models for managing IP address pools within subnets.
"""

from django.db import models

from .subnet import Subnet


class IPPool(models.Model):
    """
    Model for IP address pools.

    Represents a pool of IP addresses within a subnet that can be used for
    organized IP assignment and management.
    """

    subnet = models.ForeignKey(
        Subnet,
        on_delete=models.CASCADE,
        related_name="ip_pools",
        help_text="Subnet this pool belongs to",
    )
    name = models.CharField(
        max_length=255,
        help_text="Pool name",
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Pool description",
    )

    # Pool range
    start_ip = models.GenericIPAddressField(
        help_text="Starting IP address in the pool",
    )
    end_ip = models.GenericIPAddressField(
        help_text="Ending IP address in the pool",
    )

    # Pool configuration
    reservation_policy = models.CharField(
        max_length=50,
        choices=[
            ("none", "No Reservation"),
            ("percentage", "Percentage Reserved"),
            ("fixed", "Fixed Count Reserved"),
        ],
        default="none",
        help_text="Reservation policy for the pool",
    )
    reserved_percentage = models.IntegerField(
        default=0,
        help_text="Percentage of pool to reserve (0-100)",
    )
    reserved_count = models.IntegerField(
        default=0,
        help_text="Fixed number of IPs to reserve",
    )

    # Status
    is_active = models.BooleanField(
        default=True,
        help_text="Whether the pool is active",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "IP Pool"
        verbose_name_plural = "IP Pools"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["subnet", "is_active"]),
            models.Index(fields=["start_ip", "end_ip"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.start_ip} - {self.end_ip})"

    def get_total_ips(self):
        """Calculate total number of IPs in the pool."""
        import ipaddress

        try:
            start = ipaddress.ip_address(self.start_ip)
            end = ipaddress.ip_address(self.end_ip)
            if start.version == 4:
                return int(end) - int(start) + 1
            else:
                # IPv6 - approximate calculation
                return int(end) - int(start) + 1
        except (ValueError, AttributeError):
            return 0

    def get_reserved_count(self):
        """Calculate number of reserved IPs based on policy."""
        total = self.get_total_ips()
        if self.reservation_policy == "percentage":
            return int(total * self.reserved_percentage / 100)
        elif self.reservation_policy == "fixed":
            return min(self.reserved_count, total)
        return 0

    def get_available_count(self):
        """Calculate number of available IPs in the pool."""
        from ..models import IPAddress

        total = self.get_total_ips()
        reserved = self.get_reserved_count()

        # Count IPs in this pool that are assigned
        used = IPAddress.objects.filter(
            address__gte=self.start_ip,
            address__lte=self.end_ip,
            status__in=["assigned", "reserved"],
        ).count()

        return max(0, total - reserved - used)
