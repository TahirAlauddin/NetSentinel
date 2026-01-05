from django.db import models
from assets.models import Asset


class DisplayDetails(models.Model):
    """
    Extension table for Display category assets (TV, Monitor, Signage Screen).
    """

    asset = models.OneToOneField(
        Asset,
        on_delete=models.CASCADE,
        related_name="display_details",
        primary_key=True,
    )
    size_inches = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text="Display size in inches",
    )
    resolution = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Resolution (e.g., 1920x1080, 4K)",
    )
    panel_type = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Panel type (e.g., LCD, LED, OLED, IPS)",
    )
    refresh_rate = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text="Refresh rate in Hz",
    )

    class Meta:
        verbose_name = "Display Details"
        verbose_name_plural = "Display Details"
        db_table = "assets_display_details"

    def __str__(self):
        return f"Display Details for {self.asset}"
