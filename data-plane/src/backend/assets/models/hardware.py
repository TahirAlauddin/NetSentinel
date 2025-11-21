"""
Hardware-based asset types with processor, memory, and hard drive specifications.
"""

from django.db import models
from . import Asset


class HardwareAsset(Asset):
    """
    Abstract base for hardware assets with processor, memory, and storage.
    """

    # Hardware Details
    processor = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Processor specification (e.g., Intel Core i7-9700K)",
    )
    memory = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Memory/RAM specification (e.g., 16GB DDR4)",
    )
    hard_drive = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Hard drive/storage specification (e.g., 512GB SSD)",
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


class AppleDevice(HardwareAsset):
    """
    Apple Device asset type (MacBook, iMac, Mac Mini, etc.).
    """

    class Meta:
        verbose_name = "Apple Device"
        verbose_name_plural = "Apple Devices"
        db_table = "assets_apple_device"

    def get_asset_type(self):
        return "Apple Device"


class Desktop(HardwareAsset):
    """
    Desktop computer asset type.
    """

    class Meta:
        verbose_name = "Desktop"
        verbose_name_plural = "Desktops"
        db_table = "assets_desktop"

    def get_asset_type(self):
        return "Desktop"


class Laptop(HardwareAsset):
    """
    Laptop computer asset type.
    """

    class Meta:
        verbose_name = "Laptop"
        verbose_name_plural = "Laptops"
        db_table = "assets_laptop"

    def get_asset_type(self):
        return "Laptop"


class Server(HardwareAsset):
    """
    Server asset type.
    """

    class Meta:
        verbose_name = "Server"
        verbose_name_plural = "Servers"
        db_table = "assets_server"

    def get_asset_type(self):
        return "Server"


class VirtualMachine(HardwareAsset):
    """
    Virtual Machine asset type.
    """

    # VM-specific fields
    host_server = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Physical host server running this VM",
    )
    virtualization_platform = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Virtualization platform (e.g., VMware, Hyper-V, KVM, VirtualBox)",
    )
    vm_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Virtual Machine ID/Identifier",
    )

    class Meta:
        verbose_name = "Virtual Machine"
        verbose_name_plural = "Virtual Machines"
        db_table = "assets_virtual_machine"

    def get_asset_type(self):
        return "Virtual Machine"


class Windows(HardwareAsset):
    """
    Windows-based device asset type (Windows tablets, Surface devices, etc.).
    """

    class Meta:
        verbose_name = "Windows Device"
        verbose_name_plural = "Windows Devices"
        db_table = "assets_windows"

    def get_asset_type(self):
        return "Windows"


class ThinClient(HardwareAsset):
    """
    Thin Client asset type.
    """

    class Meta:
        verbose_name = "Thin Client"
        verbose_name_plural = "Thin Clients"
        db_table = "assets_thin_client"

    def get_asset_type(self):
        return "Thin Client"
