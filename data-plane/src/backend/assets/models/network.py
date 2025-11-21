"""
Network device asset types with ports, firmware, and product identifiers.
"""

from django.db import models
from . import Asset


class NetworkDeviceAsset(Asset):
    """
    Abstract base for network devices with ports, firmware, and product identifiers.
    """

    # Hardware Details
    ports = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Port specifications (e.g., 24x Gigabit Ethernet, 4x SFP+)",
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
    firmware = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Firmware version",
    )

    class Meta:
        abstract = True


class Firewall(NetworkDeviceAsset):
    """
    Firewall asset type.
    """

    class Meta:
        verbose_name = "Firewall"
        verbose_name_plural = "Firewalls"
        db_table = "assets_firewall"

    def get_asset_type(self):
        return "Firewall"


class Router(NetworkDeviceAsset):
    """
    Router asset type.
    """

    class Meta:
        verbose_name = "Router"
        verbose_name_plural = "Routers"
        db_table = "assets_router"

    def get_asset_type(self):
        return "Router"


class Switch(NetworkDeviceAsset):
    """
    Network Switch asset type.
    """

    class Meta:
        verbose_name = "Switch"
        verbose_name_plural = "Switches"
        db_table = "assets_switch"

    def get_asset_type(self):
        return "Switch"


class Gateway(NetworkDeviceAsset):
    """
    Gateway asset type.
    """

    class Meta:
        verbose_name = "Gateway"
        verbose_name_plural = "Gateways"
        db_table = "assets_gateway"

    def get_asset_type(self):
        return "Gateway"


class AccessPoint(NetworkDeviceAsset):
    """
    Wireless Access Point asset type.
    """

    class Meta:
        verbose_name = "Access Point"
        verbose_name_plural = "Access Points"
        db_table = "assets_access_point"

    def get_asset_type(self):
        return "Access Point"


class WAP(NetworkDeviceAsset):
    """
    WAP (Wireless Access Point) asset type.
    """

    class Meta:
        verbose_name = "WAP"
        verbose_name_plural = "WAPs"
        db_table = "assets_wap"

    def get_asset_type(self):
        return "WAP"


class Other(NetworkDeviceAsset):
    """
    Other/Uncategorized asset type with network device specifications.
    """

    class Meta:
        verbose_name = "Other Asset"
        verbose_name_plural = "Other Assets"
        db_table = "assets_other"

    def get_asset_type(self):
        return "Other"
