from django.db import models
from assets.models import Asset


class ComputerDetails(models.Model):
    """
    Extension table for Computer category assets (Laptop, Desktop, Server).
    """

    asset = models.OneToOneField(
        Asset,
        on_delete=models.CASCADE,
        related_name="computer_details",
        primary_key=True,
    )
    cpu = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="CPU specification (e.g., Intel Core i7-9700K)",
    )
    ram = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="RAM specification (e.g., 16GB DDR4)",
    )
    storage = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Storage specification (e.g., 512GB SSD)",
    )
    gpu = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="GPU specification",
    )
    os = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Operating system",
    )
    # Additional tech specs
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
        verbose_name = "Computer Details"
        verbose_name_plural = "Computer Details"
        db_table = "assets_computer_details"

    def __str__(self):
        return f"Computer Details for {self.asset}"
