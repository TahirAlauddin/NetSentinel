from django.db import models
from django.core.validators import MinValueValidator


class Location(models.Model):
    """
    Location model representing physical locations with comprehensive address information.
    In the data-plane, all locations belong to the current tenant company.
    """

    name = models.CharField(max_length=255)
    alias = models.CharField(max_length=255, blank=True, null=True)
    address1 = models.CharField(max_length=255)
    address2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100, blank=True, null=True)
    zip_code = models.CharField(max_length=20, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6, blank=True, null=True
    )
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6, blank=True, null=True
    )
    type_building = models.CharField(max_length=100, blank=True, null=True)
    mpoe = models.CharField(
        max_length=100, blank=True, null=True, help_text="Main Point of Entry"
    )
    dmarc = models.CharField(
        max_length=100, blank=True, null=True, help_text="Demarcation Point"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Location"
        verbose_name_plural = "Locations"
        ordering = ["name", "city"]

    def __str__(self):
        return f"{self.name} - {self.city}"


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


class Contact(models.Model):
    """
    Contact model representing individual contacts with comprehensive information.
    """

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    job_title = models.CharField(max_length=255, blank=True, null=True)
    business_phone = models.CharField(max_length=20, blank=True, null=True)
    alternate_phone = models.CharField(max_length=20, blank=True, null=True)
    mobile_phone = models.CharField(max_length=20, blank=True, null=True)
    address1 = models.CharField(max_length=255, blank=True, null=True)
    address2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    zip_code = models.CharField(max_length=20, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    contact_type = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Contact"
        verbose_name_plural = "Contacts"
        ordering = ["last_name", "first_name"]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class CarrierContact(models.Model):
    """
    Carrier Contact model representing carrier service provider contacts.
    Each carrier contact is associated with a location.
    """

    name = models.CharField(max_length=255)
    location = models.ForeignKey(
        Location, on_delete=models.CASCADE, related_name="carrier_contacts"
    )
    customer_service_phone = models.CharField(max_length=20, blank=True, null=True)
    technical_support_phone = models.CharField(max_length=20, blank=True, null=True)
    sales_phone = models.CharField(max_length=20, blank=True, null=True)
    billing_phone = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Carrier Contact"
        verbose_name_plural = "Carrier Contacts"
        ordering = ["name", "location"]

    def __str__(self):
        return f"{self.name} - {self.location}"


class UtilityContact(models.Model):
    """
    Utility Contact model representing utility service provider contacts.
    Each utility contact is associated with a location and has a utility type.
    """

    UTILITY_TYPE_CHOICES = [
        ("electric", "Electric"),
        ("water", "Water"),
        ("sewage", "Sewage"),
    ]

    name = models.CharField(max_length=255)
    location = models.ForeignKey(
        Location, on_delete=models.CASCADE, related_name="utility_contacts"
    )
    address1 = models.CharField(max_length=255, blank=True, null=True)
    address2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    zip_code = models.CharField(max_length=20, blank=True, null=True)
    customer_service_phone = models.CharField(max_length=20, blank=True, null=True)
    technical_support_phone = models.CharField(max_length=20, blank=True, null=True)
    sales_phone = models.CharField(max_length=20, blank=True, null=True)
    billing_phone = models.CharField(max_length=20, blank=True, null=True)
    utility_type = models.CharField(
        max_length=20, choices=UTILITY_TYPE_CHOICES, blank=True, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Utility Contact"
        verbose_name_plural = "Utility Contacts"
        ordering = ["name", "location"]

    def __str__(self):
        utility_type_display = (
            self.get_utility_type_display() if self.utility_type else "Unknown"
        )
        return f"{self.name} ({utility_type_display}) - {self.location}"
