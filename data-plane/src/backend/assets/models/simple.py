"""
Simple hardware asset types with basic product identifiers.
"""

from django.db import models
from . import Asset


class SimpleHardwareAsset(Asset):
    """
    Abstract base for simple hardware assets with basic product identifiers.
    """

    # Hardware Details
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


class Printer(SimpleHardwareAsset):
    """
    Printer asset type.
    """

    class Meta:
        verbose_name = "Printer"
        verbose_name_plural = "Printers"
        db_table = "assets_printer"

    def get_asset_type(self):
        return "Printer"


class Camera(SimpleHardwareAsset):
    """
    Camera asset type (security cameras, webcams, etc.).
    """

    class Meta:
        verbose_name = "Camera"
        verbose_name_plural = "Cameras"
        db_table = "assets_camera"

    def get_asset_type(self):
        return "Camera"


class Monitor(SimpleHardwareAsset):
    """
    Monitor/Display asset type.
    """

    class Meta:
        verbose_name = "Monitor"
        verbose_name_plural = "Monitors"
        db_table = "assets_monitor"

    def get_asset_type(self):
        return "Monitor"


class TV(SimpleHardwareAsset):
    """
    Television asset type.
    """

    class Meta:
        verbose_name = "TV"
        verbose_name_plural = "TVs"
        db_table = "assets_tv"

    def get_asset_type(self):
        return "TV"


class Toner(SimpleHardwareAsset):
    """
    Toner/Ink cartridge asset type.
    """

    class Meta:
        verbose_name = "Toner"
        verbose_name_plural = "Toners"
        db_table = "assets_toner"

    def get_asset_type(self):
        return "Toner"
