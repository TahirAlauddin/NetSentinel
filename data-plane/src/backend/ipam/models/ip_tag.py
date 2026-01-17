"""
IP Address Tag Models for IPAM.

Models for tagging and labeling IP addresses for better organization and filtering.
"""

from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator
from django.db import models

from .ip_address import IPAddress

User = get_user_model()


class IPTag(models.Model):
    """
    Model for IP address tags.

    Tags are reusable labels that can be applied to multiple IP addresses
    for organization, filtering, and reporting purposes.
    """

    COLOR_CHOICES = [
        ("blue", "Blue"),
        ("green", "Green"),
        ("red", "Red"),
        ("yellow", "Yellow"),
        ("purple", "Purple"),
        ("orange", "Orange"),
        ("pink", "Pink"),
        ("gray", "Gray"),
        ("indigo", "Indigo"),
        ("teal", "Teal"),
    ]

    name = models.CharField(
        max_length=50,
        unique=True,
        help_text="Tag name (must be unique)",
        validators=[
            RegexValidator(
                regex=r"^[a-zA-Z0-9_-]+$",
                message="Tag name can only contain letters, numbers, underscores, and hyphens",
            )
        ],
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Tag description",
    )
    color = models.CharField(
        max_length=20,
        choices=COLOR_CHOICES,
        default="blue",
        help_text="Tag color for UI display",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether the tag is active",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "IP Tag"
        verbose_name_plural = "IP Tags"
        ordering = ["name"]
        indexes = [
            models.Index(fields=["name", "is_active"]),
        ]

    def __str__(self):
        return self.name

    def get_usage_count(self):
        """Get count of IP addresses using this tag."""
        return self.ip_addresses.count()


class IPAddressTag(models.Model):
    """
    Many-to-many relationship between IP addresses and tags.

    Also stores additional metadata like when the tag was applied and by whom.
    """

    ip_address = models.ForeignKey(
        IPAddress,
        on_delete=models.CASCADE,
        related_name="ip_address_tags",
        help_text="IP address this tag is applied to",
    )
    tag = models.ForeignKey(
        IPTag,
        on_delete=models.CASCADE,
        related_name="ip_address_tags",
        help_text="Tag being applied",
    )
    applied_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="applied_ip_tags",
        help_text="User who applied this tag",
    )
    applied_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this tag was applied",
    )
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Optional notes about why this tag was applied",
    )

    class Meta:
        verbose_name = "IP Address Tag"
        verbose_name_plural = "IP Address Tags"
        unique_together = [["ip_address", "tag"]]
        ordering = ["-applied_at"]
        indexes = [
            models.Index(fields=["ip_address", "tag"]),
            models.Index(fields=["tag", "applied_at"]),
        ]

    def __str__(self):
        return f"{self.ip_address.address} - {self.tag.name}"


# Add many-to-many relationship to IPAddress model
# This will be done via a migration, but we can also add it programmatically
# by updating the IPAddress model to include:
# tags = models.ManyToManyField(
#     IPTag, through='IPAddressTag', related_name='ip_addresses', blank=True
# )
