from django.db import models

from infrastructure.models import Location


class Provider(models.Model):
    """
    Provider model representing telecom service providers.
    Each provider can offer multiple services (voice, data, etc.).
    """

    SERVICE_TYPE_CHOICES = [
        ("voice", "Voice"),
        ("data", "Data"),
        ("internet", "Internet"),
        ("mobile", "Mobile"),
        ("consolidated", "Consolidated"),
    ]

    STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
        ("pending", "Pending"),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    service_type = models.CharField(
        max_length=20, choices=SERVICE_TYPE_CHOICES, blank=True, null=True
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    account_number = models.CharField(max_length=255, blank=True, null=True)
    contact_name = models.CharField(max_length=255, blank=True, null=True)
    contact_email = models.EmailField(blank=True, null=True)
    contact_phone = models.CharField(max_length=20, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    logo_url = models.URLField(blank=True, null=True, help_text="URL to provider logo")
    monthly_cost = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True, help_text="Monthly cost in dollars"
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Provider"
        verbose_name_plural = "Providers"
        ordering = ["name"]

    def __str__(self):
        return self.name


class DataCircuit(models.Model):
    """
    Data Circuit model representing data network circuits with comprehensive details.
    Each data circuit can be associated with a location and a provider.
    """

    CIRCUIT_TYPE_CHOICES = [
        ("broadband", "Broadband"),
        ("dia", "DIA"),
        ("satellite", "Satellite"),
        ("lte_wireless", "LTE Wireless"),
        ("ptp_wireless", "PTP Wireless"),
        ("mpls", "MPLS"),
    ]

    LINE_SPEED_CHOICES = [
        ("10_mbps", "10 Mb/s"),
        ("100_mbps", "100 Mb/s"),
        ("1_gbps", "1Gb/s"),
        ("10_gbps", "10Gb/s"),
        ("100_gbps", "100Gb/s"),
    ]

    HANDOFF_TYPE_CHOICES = [
        ("copper", "Copper"),
        ("fiber", "Fiber"),
    ]

    FIBER_TYPE_CHOICES = [
        ("multimode", "Multimode"),
        ("singlemode", "Singlemode"),
    ]

    CONNECTOR_TYPE_CHOICES = [
        ("st", "ST"),
        ("sc", "SC"),
        ("lc", "LC"),
    ]

    provider = models.ForeignKey(
        Provider, on_delete=models.SET_NULL, related_name="data_circuits", blank=True, null=True
    )
    location = models.ForeignKey(
        Location, on_delete=models.SET_NULL, related_name="data_circuits", blank=True, null=True
    )
    circuit_id = models.CharField(
        max_length=255, blank=True, null=True, help_text="Primary circuit identifier"
    )
    alternate_cid = models.CharField(
        max_length=255, blank=True, null=True, help_text="Alternate circuit identifier"
    )
    carrier = models.CharField(max_length=255, blank=True, null=True)
    account_number = models.CharField(max_length=255, blank=True, null=True)
    security_code = models.CharField(max_length=255, blank=True, null=True)
    circuit_type = models.CharField(
        max_length=20, choices=CIRCUIT_TYPE_CHOICES, blank=True, null=True
    )
    line_speed = models.CharField(max_length=20, choices=LINE_SPEED_CHOICES, blank=True, null=True)
    port_speed = models.CharField(max_length=255, blank=True, null=True)
    handoff_type = models.CharField(
        max_length=20, choices=HANDOFF_TYPE_CHOICES, blank=True, null=True
    )
    fiber_type = models.CharField(max_length=20, choices=FIBER_TYPE_CHOICES, blank=True, null=True)
    connector_type = models.CharField(
        max_length=20, choices=CONNECTOR_TYPE_CHOICES, blank=True, null=True
    )
    quote_id = models.CharField(max_length=255, blank=True, null=True)
    contract_id = models.CharField(max_length=255, blank=True, null=True)
    foc_date = models.DateField(blank=True, null=True, help_text="FOC (Firm Order Commitment) Date")
    ttu_date = models.DateField(blank=True, null=True, help_text="TTU (Turn Up) Date")
    monthly_cost = models.DecimalField(
        max_digits=10, decimal_places=2, blank=True, null=True, help_text="Monthly cost in dollars"
    )
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Data Circuit"
        verbose_name_plural = "Data Circuits"
        ordering = ["circuit_id", "carrier"]

    def __str__(self):
        circuit_display = self.circuit_id or self.alternate_cid or "Unknown"
        carrier_display = f" - {self.carrier}" if self.carrier else ""
        return f"{circuit_display}{carrier_display}"
