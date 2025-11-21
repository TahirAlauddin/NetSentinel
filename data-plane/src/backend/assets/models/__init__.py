from django.db import models
from django.core.validators import MinValueValidator
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
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


class AssetAttachment(models.Model):
    """
    Attachment model for asset-related files.
    Uses GenericForeignKey to work with all asset types.
    """

    # Generic foreign key to work with any asset type
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    asset = GenericForeignKey("content_type", "object_id")

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
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]

    def __str__(self):
        asset_str = str(self.asset) if self.asset else "Unknown Asset"
        return f"{asset_str} - {self.name or self.file.name}"


class Asset(models.Model):
    """
    Abstract base model for all asset types.
    This model contains all common fields that all asset types share.
    Asset types will inherit from this model using Django's model inheritance.
    """

    # Basic Information
    name = models.CharField(max_length=255)
    asset_tag = models.CharField(
        max_length=100,
        unique=True,
        help_text="Unique identifier/tag for the asset",
    )
    vendor = models.CharField(max_length=255, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    # Network Information
    mac_address = models.CharField(
        max_length=17,
        blank=True,
        null=True,
        help_text="MAC address in format XX:XX:XX:XX:XX:XX",
    )
    ip_address = models.GenericIPAddressField(
        blank=True, null=True, help_text="IP address (IPv4 or IPv6)"
    )

    # Manufacturer & Model
    manufacturer = models.CharField(max_length=255, blank=True, null=True)
    model = models.CharField(max_length=255, blank=True, null=True)

    # Tags (Many-to-Many relationship)
    tags = models.ManyToManyField(AssetTag, blank=True, related_name="%(class)s_assets")

    # System Information
    system_uuid = models.CharField(
        max_length=36,
        blank=True,
        null=True,
        help_text="System UUID (e.g., from BIOS/UEFI)",
    )
    system_uptime = models.DurationField(
        blank=True, null=True, help_text="System uptime duration"
    )

    # Location & Usage
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
        related_name="%(class)s_assets_used",
        help_text="User currently using this asset",
    )
    managed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_assets_managed",
        help_text="User responsible for managing this asset",
    )
    location = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_assets",
        help_text="Physical location of the asset",
    )
    departments = models.ManyToManyField(
        Department, blank=True, related_name="%(class)s_assets"
    )

    # Cost & Depreciation
    custom_lifecycle = models.ForeignKey(
        CustomLifecycle,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="%(class)s_assets",
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

    # Warranty & Acquisition
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

    # Alerts & Additional Details
    calendar_alerts = models.BooleanField(
        default=False,
        help_text="Enable calendar alerts for this asset",
    )
    additional_details = models.JSONField(
        blank=True,
        null=True,
        help_text="Additional custom details in JSON format",
    )

    # Related Items (self-referential Many-to-Many)
    related_items = models.ManyToManyField(
        "self",
        symmetrical=True,
        blank=True,
        help_text="Related assets",
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["name", "asset_tag"]

    def __str__(self):
        return f"{self.name} ({self.asset_tag})"

    def get_asset_type(self):
        """
        Returns the asset type based on the concrete model class.
        This will be overridden in child classes.
        """
        return self.__class__.__name__

    def get_attachments(self):
        """
        Returns all attachments for this asset using GenericForeignKey.
        """
        content_type = ContentType.objects.get_for_model(self.__class__)
        return AssetAttachment.objects.filter(
            content_type=content_type, object_id=self.pk
        )


class AssetRelation(models.Model):
    """
    Relation model for assets.
    """
    asset = models.ForeignKey('Asset', on_delete=models.CASCADE, related_name="%(class)s_related_to")
    related_asset = models.ForeignKey('Asset', on_delete=models.CASCADE, related_name="%(class)s_related_to")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

# Import all asset types
from .hardware import (
    AppleDevice,
    Desktop,
    Laptop,
    Server,
    VirtualMachine,
    Windows,
    ThinClient,
)
from .network import (
    Firewall,
    Router,
    Switch,
    Gateway,
    AccessPoint,
    WAP,
    Other,
)
from .mobile import (
    iPad,
    iPhone,
    Mobile,
    CellularPhone,
)
from .phone import (
    Phone,
    PhoneSystem,
)
from .simple import (
    Printer,
    Camera,
    Monitor,
    TV,
    Toner,
)
from .special import (
    Dongle,
    OfficeFurniture,
    Unrecognized,
)

# All asset types for easy access
__all__ = [
    # Base models
    "AssetTag",
    "CustomLifecycle",
    "AssetAttachment",
    "Asset",
    # Hardware assets
    "AppleDevice",
    "Desktop",
    "Laptop",
    "Server",
    "VirtualMachine",
    "Windows",
    "ThinClient",
    # Network assets
    "Firewall",
    "Router",
    "Switch",
    "Gateway",
    "AccessPoint",
    "WAP",
    "Other",
    # Mobile assets
    "iPad",
    "iPhone",
    "Mobile",
    "CellularPhone",
    # Phone assets
    "Phone",
    "PhoneSystem",
    # Simple hardware assets
    "Printer",
    "Camera",
    "Monitor",
    "TV",
    "Toner",
    # Special assets
    "Dongle",
    "OfficeFurniture",
    "Unrecognized",
]
