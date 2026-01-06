from django.db import models

from infrastructure.models import Location


class DNSZone(models.Model):
    """
    DNS Zone model for DNS domain management.
    """

    name = models.CharField(
        max_length=255,
        unique=True,
        help_text="DNS zone name (e.g., example.com)",
    )
    description = models.TextField(blank=True, null=True)
    location = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="dns_zones",
        help_text="Location associated with this DNS zone",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "DNS Zone"
        verbose_name_plural = "DNS Zones"
        ordering = ["name"]

    def __str__(self):
        return self.name


class DNSRecord(models.Model):
    """
    DNS Record model for individual DNS entries.
    """

    RECORD_TYPE_CHOICES = [
        ("A", "A"),
        ("AAAA", "AAAA"),
        ("CNAME", "CNAME"),
        ("MX", "MX"),
        ("TXT", "TXT"),
        ("NS", "NS"),
        ("PTR", "PTR"),
        ("SRV", "SRV"),
    ]

    zone = models.ForeignKey(
        DNSZone,
        on_delete=models.CASCADE,
        related_name="records",
        help_text="DNS zone this record belongs to",
    )
    name = models.CharField(
        max_length=255,
        help_text="Record name (relative to zone or FQDN)",
    )
    record_type = models.CharField(
        max_length=10,
        choices=RECORD_TYPE_CHOICES,
        help_text="DNS record type",
    )
    value = models.TextField(
        help_text="Record value (content)",
    )
    ttl = models.PositiveIntegerField(
        default=3600,
        help_text="Time to live in seconds",
    )
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "DNS Record"
        verbose_name_plural = "DNS Records"
        ordering = ["zone", "name", "record_type"]
        unique_together = [["zone", "name", "record_type"]]

    def __str__(self):
        return f"{self.name}.{self.zone.name} ({self.record_type})"
