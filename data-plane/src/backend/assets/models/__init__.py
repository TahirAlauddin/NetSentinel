from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.contenttypes.models import ContentType
from users.models import User
from infrastructure.models import Location, Department


class AssetTag(models.Model):
    """
    Tag model for categorizing assets with custom tags.
    """

    name = models.CharField(max_length=100, unique=True)
    color = models.CharField(
        max_length=7,
        blank=True,
        null=True,
        help_text="Hex color code for tag display (e.g., #FF5733)",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Asset Tag"
        verbose_name_plural = "Asset Tags"
        ordering = ["name"]

    def __str__(self):
        return self.name


class CustomLifecycle(models.Model):
    """
    Custom lifecycle model for asset lifecycle management.
    """

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Custom Lifecycle"
        verbose_name_plural = "Custom Lifecycles"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Vendor(models.Model):
    """
    Vendor model for asset vendors/suppliers.
    """

    name = models.CharField(max_length=255, unique=True)
    contact_info = models.TextField(
        blank=True, null=True, help_text="Contact information for the vendor"
    )
    website = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Vendor"
        verbose_name_plural = "Vendors"
        ordering = ["name"]

    def __str__(self):
        return self.name


class AssetCategory(models.Model):
    """
    Category model for hierarchical asset categorization.
    """

    name = models.CharField(max_length=100, unique=True, null=False, blank=False)
    tech_specs = models.ForeignKey(
        "TechSpecs",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="categories",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Asset Category"
        verbose_name_plural = "Asset Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Asset(models.Model):
    """
    Core Asset model - concrete table for all asset types.
    This is the universal container that holds common fields for all assets.
    Category-specific details are stored in extension tables.
    """

    STATUS_CHOICES = [
        ("active", "Active"),
        ("retired", "Retired"),
        ("in_repair", "In Repair"),
        ("disposed", "Disposed"),
    ]

    # Basic Information
    name = models.CharField(max_length=255)
    category = models.ForeignKey(
        AssetCategory,
        on_delete=models.CASCADE,
        related_name="assets",
        help_text="Asset category",
    )
    asset_tag = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Unique identifier/tag for the asset",
    )
    impact = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text="Impact of the asset",
        validators=[MinValueValidator(1), MaxValueValidator(3)],
    )
    vendor = models.ForeignKey(
        Vendor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assets",
        help_text="Vendor/supplier of the asset",
    )
    model = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="General model name",
    )
    serial_number = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Serial number",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active",
        help_text="Asset status",
    )
    purchase_date = models.DateField(
        blank=True,
        null=True,
        help_text="Purchase date",
    )
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_assets",
        help_text="User assigned to this asset",
    )
    location = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assets",
        help_text="Physical location of the asset",
    )

    # Additional common fields from original Asset model
    notes = models.TextField(blank=True, null=True)
    mac_address = models.CharField(
        max_length=17,
        blank=True,
        null=True,
        help_text="MAC address in format XX:XX:XX:XX:XX:XX",
    )
    ip_address = models.GenericIPAddressField(
        blank=True, null=True, help_text="IP address (IPv4 or IPv6)"
    )
    manufacturer = models.CharField(max_length=255, blank=True, null=True)
    tags = models.ManyToManyField(AssetTag, blank=True, null=True, related_name="assets")
    system_uuid = models.CharField(
        max_length=36,
        blank=True,
        null=True,
        help_text="System UUID (e.g., from BIOS/UEFI)",
    )
    system_uptime = models.DurationField(blank=True, null=True, help_text="System uptime duration")
    in_current_state_since = models.DateField(
        blank=True,
        null=True,
        help_text="Date when asset entered current state",
    )
    expected_checkin_date = models.DateField(
        blank=True,
        null=True,
        help_text="Expected date for asset check-in",
    )
    used_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assets_used",
        help_text="User currently using this asset",
    )
    managed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assets_managed",
        help_text="User responsible for managing this asset",
    )
    departments = models.ManyToManyField(Department, blank=True, related_name="assets")
    custom_lifecycle = models.ForeignKey(
        CustomLifecycle,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assets",
    )
    purchase_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(0)],
        help_text="Purchase price of the asset",
    )
    replacement_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(0)],
        help_text="Estimated replacement cost",
    )
    salvage_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(0)],
        help_text="Estimated salvage value at end of life",
    )
    useful_life_years = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text="Expected useful life in years",
    )
    approaching_eol_months = models.PositiveIntegerField(
        blank=True,
        null=True,
        help_text="Months before approaching end-of-life",
    )
    po_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Purchase Order number",
    )
    machine_serial_number = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Manufacturer serial number",
    )
    product_number = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Product/part number",
    )
    acquisition_date = models.DateField(
        blank=True,
        null=True,
        help_text="Date when asset was acquired",
    )
    warranty_expiration = models.DateField(
        blank=True,
        null=True,
        help_text="Warranty expiration date",
    )
    installation_date = models.DateField(
        blank=True,
        null=True,
        help_text="Date when asset was installed",
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Asset"
        verbose_name_plural = "Assets"
        ordering = ["name"]
        db_table = "assets_asset"

    def __str__(self):
        return f"{self.name}"

    def get_asset_type(self):
        """
        Returns the asset type based on the category.
        """
        if self.category:
            return self.category.name
        return "Unknown"

    def get_attachments(self):
        """
        Returns all attachments for this asset using GenericForeignKey.
        """
        content_type = ContentType.objects.get_for_model(self.__class__)
        return AssetAttachment.objects.filter(content_type=content_type, object_id=self.pk)


class CalendarAlert(models.Model):
    """
    Calendar alert model for asset calendar alerts.
    """

    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name="calendar_alerts")
    date = models.DateField(help_text="Date to alert on")
    message = models.TextField(blank=True, null=True, help_text="Alert message/description")
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="calendar_alerts",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Calendar Alert"
        verbose_name_plural = "Calendar Alerts"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.asset.name} - {self.date}"


class AssetImage(models.Model):
    """
    Image model for asset images.
    """

    image = models.ImageField(upload_to="assets/images/")
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name="images")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Asset Image"
        verbose_name_plural = "Asset Images"
        ordering = ["-created_at"]

    def __str__(self):
        return self.image.name


class AssetAttachment(models.Model):
    """
    Attachment model for asset-related files.
    Uses GenericForeignKey to work with Asset model.
    """

    # Generic foreign key to work with Asset
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name="attachments")

    file = models.FileField(upload_to="assets/attachments/")
    name = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="asset_attachments",
    )

    class Meta:
        verbose_name = "Asset Attachment"
        verbose_name_plural = "Asset Attachments"
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.asset.name} - {self.name or self.file.name}"


class AssetRelation(models.Model):
    """
    Relation model for assets.
    """

    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name="related_to")
    related_asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name="related_from")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Asset Relation"
        verbose_name_plural = "Asset Relations"
        unique_together = [["asset", "related_asset"]]

    def __str__(self):
        return f"{self.asset} → {self.related_asset}"


class TechSpecs(models.Model):
    """
    Model to store major tech specs categories.
    i.e. Computer, Network, Display, Phone, Peripheral.
    """

    name = models.CharField(max_length=255, unique=True, null=False, blank=False)

    class Meta:
        verbose_name = "Tech Specs"
        verbose_name_plural = "Tech Specs"
        db_table = "assets_tech_specs"

    def __str__(self):
        return self.name


# Import all the extension models after main models are defined
# This avoids circular imports since extension models import Asset
from .computer import ComputerDetails  # noqa: E402
from .network import NetworkDetails  # noqa: E402
from .display import DisplayDetails  # noqa: E402
from .phone import PhoneDetails  # noqa: E402
from .peripheral import PeripheralDetails  # noqa: E402

__all__ = [
    "ComputerDetails",
    "NetworkDetails",
    "DisplayDetails",
    "PhoneDetails",
    "PeripheralDetails",
]
