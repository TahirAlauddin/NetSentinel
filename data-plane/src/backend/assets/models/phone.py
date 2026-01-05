from django.db import models
from assets.models import Asset


class PhoneDetails(models.Model):
    """
    Extension table for Phone category assets (VoIP, Desk Phone).
    """

    asset = models.OneToOneField(
        Asset,
        on_delete=models.CASCADE,
        related_name="phone_details",
        primary_key=True,
    )
    connection_interface = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Connection interface (e.g., VoIP, Analog, Digital, SIP)",
    )
    phone_type = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Phone type (e.g., Desk Phone, VoIP Phone)",
    )
    extension = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Phone extension number",
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
        verbose_name = "Phone Details"
        verbose_name_plural = "Phone Details"
        db_table = "assets_phone_details"

    def __str__(self):
        return f"Phone Details for {self.asset}"
