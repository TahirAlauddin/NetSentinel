"""
Device Models for IPAM.

Models for network device management within IPAM context.
"""

from django.db import models

from infrastructure.models import Location


class DeviceType(models.Model):
    """
    Device Type model for categorizing network devices.

    Examples: Database, Switch, Wireless, Router, Server, Other
    """

    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Device type name (e.g., Switch, Router, Wireless)",
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Description of this device type",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this device type is active",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Device Type"
        verbose_name_plural = "Device Types"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Rack(models.Model):
    """
    Rack model for physical rack management.

    Represents a physical rack where devices can be mounted.
    """

    name = models.CharField(
        max_length=255,
        help_text="Rack name/identifier",
    )
    location = models.ForeignKey(
        Location,
        on_delete=models.CASCADE,
        related_name="racks",
        help_text="Location where this rack is located",
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Rack description",
    )
    total_units = models.PositiveIntegerField(
        default=42,
        help_text="Total rack units (U) available",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Rack"
        verbose_name_plural = "Racks"
        ordering = ["location", "name"]
        unique_together = [["name", "location"]]

    def __str__(self):
        return f"{self.name} ({self.location})"


class Device(models.Model):
    """
    Device model for network device management in IPAM.

    Represents network devices like switches, routers, access points, servers, etc.
    """

    SWITCH_PORT_CHOICES = [
        ("wired", "Wired"),
        ("wireless", "Wireless"),
    ]

    SECTION_CHOICES = [
        ("servers", "Servers"),
        ("ipv6", "IPv6 Section"),
    ]

    name = models.CharField(
        max_length=255,
        help_text="Device hostname/name",
    )
    ip_address = models.GenericIPAddressField(
        blank=True,
        null=True,
        help_text="Primary IP address (IPv4 or IPv6)",
    )
    device_type = models.ForeignKey(
        DeviceType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="devices",
        help_text="Type of device",
    )
    location = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="devices",
        help_text="Physical location of the device",
    )
    rack = models.ForeignKey(
        Rack,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="devices",
        help_text="Rack where device is mounted",
    )
    rack_position = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Position in rack (U unit)",
    )
    rack_size = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Size of device in rack units (U)",
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Device description",
    )
    vendor = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Device vendor/manufacturer",
    )
    model = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Device model",
    )
    version = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Device version/firmware",
    )
    switch_port = models.CharField(
        max_length=20,
        choices=SWITCH_PORT_CHOICES,
        blank=True,
        null=True,
        help_text="Switch port type",
    )
    sections = models.JSONField(
        default=list,
        blank=True,
        help_text="Sections to display device in (e.g., ['servers', 'ipv6'])",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether the device is active",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Device"
        verbose_name_plural = "Devices"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name"]),
            models.Index(fields=["ip_address"]),
            models.Index(fields=["device_type", "is_active"]),
            models.Index(fields=["location", "rack"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.ip_address or 'No IP'})"

    def get_hosts_count(self):
        """Get count of IP addresses assigned to this device."""
        from .ip_address import IPAddress

        return (
            IPAddress.objects.filter(
                assigned_to_asset__isnull=True,  # For now, we'll link via IP address matching
                address=self.ip_address,
            ).count()
            if self.ip_address
            else 0
        )
