"""
Contract models for NetSentinel data-plane.

This module defines the Contract model used to store carrier contract information
(carrier, contract number, dates, NRC/MRC). Contracts are tenant-scoped in the
data-plane; all contracts belong to the current tenant company.

Architecture:
- Contract is a standalone entity (no FK to infrastructure.CarrierContact or Circuit)
  so that contracts can exist before/without linked circuits and carrier names
  stay consistent with existing Circuit.carrier (CharField) usage.
- Monetary fields (NRC, MRC) use DecimalField for precision.
- Document uploads use a secure FileField with extension/size validators and
  UUID-based filenames to prevent path traversal and malicious file execution.
"""

from django.core.validators import MinValueValidator
from django.db import models

from .validators import (
    contract_document_upload_to,
    contract_logo_upload_to,
    validate_contract_file_extension,
    validate_contract_file_size,
    validate_contract_logo_extension,
    validate_contract_logo_size,
)


class ContractCategory(models.Model):
    """
    Category for contract classification (e.g. Telecom, IT and Security).
    Seeded via management command; contracts can optionally be assigned one.
    """

    name = models.CharField(max_length=100, unique=True)

    class Meta:
        verbose_name = "Contract category"
        verbose_name_plural = "Contract categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Contract(models.Model):
    """
    Contract model representing carrier service agreements.

    Stores carrier name, contract number, signing/reference date, non-recurring
    charge (NRC), monthly recurring charge (MRC), and term start/end dates.
    In the data-plane, all contracts belong to the current tenant company.
    """

    carrier = models.CharField(
        max_length=255,
        help_text="Carrier or service provider name (e.g. AT&T, Verizon).",
    )
    contract_number = models.CharField(
        max_length=100,
        help_text="Carrier-provided or internal contract identifier.",
    )
    date = models.DateField(
        blank=True,
        null=True,
        help_text="Contract signing or reference date.",
    )
    nrc = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Non-Recurring Charge (one-time).",
    )
    mrc = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Monthly Recurring Charge.",
    )
    CONTRACT_TYPE_CHOICES = [
        ("fixed_term", "Fixed Term"),
        ("monthly", "Monthly"),
    ]
    contract_type = models.CharField(
        max_length=20,
        choices=CONTRACT_TYPE_CHOICES,
        default="fixed_term",
        help_text="Fixed Term has defined end date; Monthly is ongoing.",
    )
    start_date = models.DateField(
        help_text="Contract term start date.",
    )
    end_date = models.DateField(
        blank=True,
        null=True,
        help_text="Contract term end date. Required for Fixed Term; optional for Monthly.",
    )
    document = models.FileField(
        upload_to=contract_document_upload_to,
        blank=True,
        null=True,
        validators=[validate_contract_file_extension, validate_contract_file_size],
        help_text="Contract document (PDF, DOC, etc.). Max 10 MB. Stored with a safe filename.",
    )
    logo = models.ImageField(
        upload_to=contract_logo_upload_to,
        blank=True,
        null=True,
        validators=[validate_contract_logo_extension, validate_contract_logo_size],
        help_text="Contract/carrier logo image. PNG, JPG, GIF, WebP. Max 2 MB.",
    )
    category = models.ForeignKey(
        ContractCategory,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="contracts",
        help_text="Contract category (e.g. Telecom, IT and Security).",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Contract"
        verbose_name_plural = "Contracts"
        ordering = ["carrier", "contract_number"]
        # Allow same contract_number across different carriers
        constraints = [
            models.UniqueConstraint(
                fields=["carrier", "contract_number"],
                name="contracts_contract_unique_carrier_contract_number",
            )
        ]

    def __str__(self):
        return f"{self.carrier} – {self.contract_number}"
