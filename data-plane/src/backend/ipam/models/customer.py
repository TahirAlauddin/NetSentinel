from django.db import models


class Customer(models.Model):
    """
    Customer model for managing customer profiles in IPAM.
    """

    name = models.CharField(
        max_length=255,
        help_text="Customer name",
    )
    description = models.TextField(blank=True, null=True)
    contact_email = models.EmailField(
        blank=True, null=True, unique=True, help_text="Primary contact email"
    )
    contact_phone = models.CharField(
        max_length=20, blank=True, null=True, help_text="Primary contact phone"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Customer"
        verbose_name_plural = "Customers"
        ordering = ["name"]

    def __str__(self):
        return self.name
