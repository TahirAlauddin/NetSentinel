"""
DHCP Option Models for IPAM.

Models for storing DHCP options associated with DHCP scopes.
"""

from django.db import models

from .dhcp import DHCPScope


class DHCPOption(models.Model):
    """
    Model for DHCP options.

    Represents a DHCP option that can be assigned to a DHCP scope.
    """

    scope = models.ForeignKey(
        DHCPScope,
        on_delete=models.CASCADE,
        related_name="options",
        help_text="DHCP scope this option belongs to",
    )
    option_code = models.IntegerField(
        help_text="DHCP option code (1-255)",
        db_index=True,
    )
    value = models.TextField(
        help_text="Option value (format depends on option type)",
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Optional description for this option",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "DHCP Option"
        verbose_name_plural = "DHCP Options"
        ordering = ["scope", "option_code"]
        indexes = [
            models.Index(fields=["scope", "option_code"]),
        ]
        unique_together = [["scope", "option_code"]]

    def __str__(self):
        return f"Option {self.option_code} for {self.scope.name}"
