from django.db import models

from infrastructure.models import Location


class VRF(models.Model):
    """
    VRF (Virtual Routing and Forwarding) model for network isolation.
    """

    name = models.CharField(max_length=255)
    rd = models.CharField(
        max_length=21,
        blank=True,
        null=True,
        help_text="Route Distinguisher (e.g., 65000:100)",
    )
    description = models.TextField(blank=True, null=True)
    location = models.ForeignKey(
        Location,
        on_delete=models.CASCADE,
        related_name="vrfs",
        help_text="Location where this VRF is used",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "VRF"
        verbose_name_plural = "VRFs"
        ordering = ["name"]
        unique_together = [["name", "location"]]

    def __str__(self):
        rd_display = f" (RD: {self.rd})" if self.rd else ""
        return f"{self.name}{rd_display}"
