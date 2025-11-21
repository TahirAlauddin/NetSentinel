"""
Phone and phone system asset types with connection interface specifications.
"""

from django.db import models
from . import Asset


class PhoneAsset(Asset):
    """
    Abstract base for phone devices with connection interface and product identifiers.
    """

    # Hardware Details
    connection_interface = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Connection interface (e.g., VoIP, Analog, Digital, SIP)",
    )
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
        abstract = True


class Phone(PhoneAsset):
    """
    Phone asset type (desk phones, cordless phones, etc.).
    """

    class Meta:
        verbose_name = "Phone"
        verbose_name_plural = "Phones"
        db_table = "assets_phone"

    def get_asset_type(self):
        return "Phone"


class PhoneSystem(PhoneAsset):
    """
    Phone System asset type (PBX, VoIP systems, etc.).
    """

    class Meta:
        verbose_name = "Phone System"
        verbose_name_plural = "Phone Systems"
        db_table = "assets_phone_system"

    def get_asset_type(self):
        return "Phone System"
