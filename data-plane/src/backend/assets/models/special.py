"""
Special asset types with unique specifications.
"""

from django.db import models
from . import Asset, AssetTag


class Dongle(Asset):
    """
    Dongle asset type with network and product identifiers.
    Note: IP Address, Manufacturer, Model, Tags, System UUID, and System Uptime
    are inherited from the base Asset model.
    """

    # Hardware Details (unique to Dongle)
    mac_addresses = models.TextField(
        blank=True,
        null=True,
        help_text="Multiple MAC addresses (one per line)",
    )
    model_number = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Model number",
    )
    sku = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Stock Keeping Unit",
    )
    upc = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Universal Product Code",
    )
    mpn = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Manufacturer Part Number",
    )
    cpn = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Customer Part Number",
    )
    ean = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="European Article Number",
    )
    gtin = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Global Trade Item Number",
    )

    class Meta:
        verbose_name = "Dongle"
        verbose_name_plural = "Dongles"
        db_table = "assets_dongle"

    def get_asset_type(self):
        return "Dongle"


class OfficeFurniture(Asset):
    """
    Office Furniture asset type (minimal specifications).
    """

    class Meta:
        verbose_name = "Office Furniture"
        verbose_name_plural = "Office Furniture"
        db_table = "assets_office_furniture"

    def get_asset_type(self):
        return "Office Furniture"


class Unrecognized(Asset):
    """
    Unrecognized/Unknown asset type (minimal specifications).
    """

    class Meta:
        verbose_name = "Unrecognized Asset"
        verbose_name_plural = "Unrecognized Assets"
        db_table = "assets_unrecognized"

    def get_asset_type(self):
        return "Unrecognized"
