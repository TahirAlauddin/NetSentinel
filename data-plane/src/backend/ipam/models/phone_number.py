"""
Phone Number model for IPAM.

Manages phone number ranges and assignments.
"""

from django.db import models

from infrastructure.models import Location


class PhoneNumberRange(models.Model):
    """
    Model for managing phone number ranges.
    
    Represents a range of phone numbers with associated carrier, trunk, and location.
    """

    location = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="phone_number_ranges",
        help_text="Location associated with this phone number range",
    )
    carrier = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Telecom carrier/provider",
    )
    trunk = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Trunk identifier",
    )
    start_number = models.CharField(
        max_length=20,
        help_text="Starting phone number in the range",
    )
    stop_number = models.CharField(
        max_length=20,
        help_text="Ending phone number in the range",
    )
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Additional notes about this phone number range",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Phone Number Range"
        verbose_name_plural = "Phone Number Ranges"
        ordering = ["start_number"]
        indexes = [
            models.Index(fields=["location", "start_number"]),
            models.Index(fields=["carrier", "start_number"]),
        ]

    def __str__(self):
        return f"{self.start_number} - {self.stop_number} ({self.carrier or 'No Carrier'})"

    def get_number_count(self):
        """Calculate the number of phone numbers in this range."""
        try:
            # Simple calculation - in real implementation, you'd parse phone numbers properly
            start = int("".join(filter(str.isdigit, self.start_number)))
            stop = int("".join(filter(str.isdigit, self.stop_number)))
            return max(0, stop - start + 1)
        except (ValueError, AttributeError):
            return 0
