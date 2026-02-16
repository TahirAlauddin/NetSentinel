from django.conf import settings
from django.core.validators import RegexValidator
from django.db import models

from infrastructure.models import Location


extension_validator = RegexValidator(
    regex=r"^\d{1,10}$",
    message="Extension number must be 1 to 10 digits.",
)


class ManagedPhoneNumber(models.Model):
    """
    Management record for an individual phone number.
    The number is stored here; optionally link to telecom.PhoneNumber for billing/TEM context.
    """

    SERVICE_TYPE_CHOICES = [
        ("fax", "Fax"),
        ("ivr", "IVR"),
        ("ring_group", "Ring Group"),
        ("forwarder", "Forwarder"),
        ("extension", "Extension"),
    ]

    number = models.CharField(
        max_length=32,
        unique=True,
        help_text="Phone number (e.g. +1-312-273-2048 or E.164).",
    )
    location = models.ForeignKey(
        Location,
        on_delete=models.PROTECT,
        related_name="managed_phone_numbers",
    )
    assigned_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="managed_phone_numbers",
        blank=True,
        null=True,
    )
    name = models.CharField(max_length=255)
    extension_number = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        validators=[extension_validator],
        help_text="Internal extension (1 to 10 digits).",
    )
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPE_CHOICES)
    did_enabled = models.BooleanField(
        default=False,
        help_text="If enabled, this external number can be dialed internally (DID).",
    )
    did_external_number = models.CharField(
        max_length=32,
        blank=True,
        null=True,
        help_text="Optional external DID number mapped to this record.",
    )
    is_static_assignment = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["location__name", "name", "number"]
        verbose_name = "Managed Phone Number"
        verbose_name_plural = "Managed Phone Numbers"
        indexes = [
            models.Index(fields=["location", "service_type"]),
            models.Index(fields=["extension_number"]),
            models.Index(fields=["number"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.number})"


class ManagedPhoneNumberBlock(models.Model):
    """
    Management record for a block/range of numbers at a location.
    Service type and extension are intentionally not present by business rule.
    """

    location = models.ForeignKey(
        Location,
        on_delete=models.PROTECT,
        related_name="managed_phone_number_blocks",
    )
    name = models.CharField(max_length=255)
    start_number = models.CharField(max_length=32)
    end_number = models.CharField(max_length=32)
    is_static_assignment = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["location__name", "start_number"]
        verbose_name = "Managed Phone Number Block"
        verbose_name_plural = "Managed Phone Number Blocks"
        indexes = [
            models.Index(fields=["location", "start_number", "end_number"]),
        ]

    def __str__(self):
        return f"{self.name}: {self.start_number} - {self.end_number}"
