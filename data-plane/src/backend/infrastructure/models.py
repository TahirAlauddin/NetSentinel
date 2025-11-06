from django.db import models
from django.core.validators import MinValueValidator


class Location(models.Model):
    """
    Location model representing physical locations with city and address.
    In the data-plane, all locations belong to the current tenant company.
    """

    city = models.CharField(max_length=100)
    address = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Location"
        verbose_name_plural = "Locations"
        ordering = ["city", "address"]
        unique_together = [["city", "address"]]

    def __str__(self):
        return f"{self.city} - {self.address}"


class Circuit(models.Model):
    """
    Circuit model representing network circuits.
    Each circuit belongs to a location, and a location can have multiple circuits.
    """

    location = models.ForeignKey(
        Location, on_delete=models.CASCADE, related_name="circuits"
    )
    speed = models.PositiveIntegerField(
        help_text="Circuit speed in Mbps", validators=[MinValueValidator(1)]
    )
    carrier = models.CharField(max_length=255)
    circuit_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Carrier-provided circuit identifier",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Circuit"
        verbose_name_plural = "Circuits"
        ordering = ["location", "carrier"]

    def __str__(self):
        circuit_display = f"{self.circuit_id}" if self.circuit_id else f"{self.carrier}"
        return f"{self.location} - {circuit_display} ({self.speed} Mbps)"


class PointOfContact(models.Model):
    """
    Point of Contact model for Technical and Administrative contacts.
    Each circuit can have multiple points of contact.
    """

    CONTACT_TYPE_CHOICES = [
        ("technical", "Technical PoC"),
        ("administrative", "Administrative PoC"),
    ]

    circuit = models.ForeignKey(
        Circuit, on_delete=models.CASCADE, related_name="points_of_contact"
    )
    contact_type = models.CharField(max_length=20, choices=CONTACT_TYPE_CHOICES)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Point of Contact"
        verbose_name_plural = "Points of Contact"
        ordering = ["circuit", "contact_type"]
        unique_together = [["circuit", "contact_type"]]

    def __str__(self):
        return f"{self.circuit} - {self.get_contact_type_display()}: {self.name}"


class Department(models.Model):
    """
    Department model representing organizational departments.
    In the data-plane, all departments belong to the current tenant company.
    """

    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Department"
        verbose_name_plural = "Departments"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Category(models.Model):
    """
    Category model representing asset/service categories.
    In the data-plane, all categories belong to the current tenant company.
    """

    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name
