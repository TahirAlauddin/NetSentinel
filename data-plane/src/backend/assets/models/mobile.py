"""
Mobile device asset types with IMEI and mobile-specific identifiers.
"""

from django.db import models
from . import Asset


class MobileDeviceAsset(Asset):
    """
    Abstract base for mobile devices with IMEI and product identifiers.
    """

    # Hardware Details
    imei = models.CharField(
        max_length=15,
        blank=True,
        null=True,
        help_text="International Mobile Equipment Identity",
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


class iPad(MobileDeviceAsset):
    """
    iPad asset type.
    """

    class Meta:
        verbose_name = "iPad"
        verbose_name_plural = "iPads"
        db_table = "assets_ipad"

    def get_asset_type(self):
        return "iPad"


class iPhone(MobileDeviceAsset):
    """
    iPhone asset type.
    """

    class Meta:
        verbose_name = "iPhone"
        verbose_name_plural = "iPhones"
        db_table = "assets_iphone"

    def get_asset_type(self):
        return "iPhone"


class Mobile(MobileDeviceAsset):
    """
    Mobile device asset type (generic smartphones/tablets).
    """

    class Meta:
        verbose_name = "Mobile Device"
        verbose_name_plural = "Mobile Devices"
        db_table = "assets_mobile"

    def get_asset_type(self):
        return "Mobile"


class CellularPhone(MobileDeviceAsset):
    """
    Cellular Phone asset type.
    """

    class Meta:
        verbose_name = "Cellular Phone"
        verbose_name_plural = "Cellular Phones"
        db_table = "assets_cellular_phone"

    def get_asset_type(self):
        return "Cellular Phone"
