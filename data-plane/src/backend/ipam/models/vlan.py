from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models

from infrastructure.models import Location


class VLAN(models.Model):
    """
    VLAN (Virtual LAN) model for network segmentation.
    """

    vlan_id = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(4094)],
        help_text="VLAN ID (1-4094)",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    location = models.ForeignKey(
        Location,
        on_delete=models.CASCADE,
        related_name="vlans",
        help_text="Location where this VLAN is used",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "VLAN"
        verbose_name_plural = "VLANs"
        ordering = ["vlan_id"]
        unique_together = [["vlan_id", "location"]]

    def __str__(self):
        return f"VLAN {self.vlan_id} - {self.name}"
