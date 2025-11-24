from django.db import models
from assets.models import Asset

class PeripheralDetails(models.Model):
    """
    Extension table for Peripheral category assets (Keyboard, Mouse, Webcam).
    """

    asset = models.OneToOneField(
        Asset,
        on_delete=models.CASCADE,
        related_name="peripheral_details",
        primary_key=True,
    )
    connection_type = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Connection type (e.g., USB, Bluetooth, Wireless)",
    )
    peripheral_type = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Peripheral type (e.g., Keyboard, Mouse, Webcam)",
    )
    # Additional tech specs
    serial_number = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Hardware serial number",
    )
    product_model_number = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Product/Model number",
    )

    class Meta:
        verbose_name = "Peripheral Details"
        verbose_name_plural = "Peripheral Details"
        db_table = "assets_peripheral_details"

    def __str__(self):
        return f"Peripheral Details for {self.asset}"
