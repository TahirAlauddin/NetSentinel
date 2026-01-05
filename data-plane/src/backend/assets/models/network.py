from django.db import models

from assets.models import Asset


class NetworkDetails(models.Model):
    """
    Extension table for Network category assets (Router, Switch, Access Point).
    """

    asset = models.OneToOneField(
        Asset,
        on_delete=models.CASCADE,
        related_name="network_details",
        primary_key=True,
    )
    mac_address = models.CharField(
        max_length=17,
        blank=True,
        null=True,
        help_text="MAC address in format XX:XX:XX:XX:XX:XX",
    )
    ip_address = models.GenericIPAddressField(
        blank=True, null=True, help_text="IP address (IPv4 or IPv6)"
    )
    firmware = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Firmware version",
    )
    ports_count = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text="Number of ports",
    )
    throughput = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Throughput specification (e.g., 1Gbps, 10Gbps)",
    )
    # Additional tech specs
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

    class Meta:
        verbose_name = "Network Details"
        verbose_name_plural = "Network Details"
        db_table = "assets_network_details"

    def __str__(self):
        return f"Network Details for {self.asset}"
