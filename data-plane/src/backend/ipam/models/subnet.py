import ipaddress
import re

from django.core.validators import RegexValidator
from django.db import models

from infrastructure.models import Location

from ..constants import CIDR_REGEX_PATTERN
from .customer import Customer
from .subnet_group import SubnetGroup
from .vlan import VLAN
from .vrf import VRF


class Subnet(models.Model):
    """
    Subnet model for IP address space management.
    Supports both IPv4 and IPv6 networks in CIDR notation.
    """

    STATUS_CHOICES = [
        ("planned", "Planned"),  # planned, pending
        ("active", "Active"),  # active, in use
        ("deprecated", "Deprecated"),  # deprecated, retired
    ]

    network = models.CharField(
        max_length=43,  # supports IPv6
        validators=[
            RegexValidator(
                CIDR_REGEX_PATTERN,
                flags=re.VERBOSE,
                message=(
                    "Network must be in valid IPv4 or IPv6 CIDR notation "
                    "(e.g., 192.168.1.0/24 or 2001:db8::/32)"
                ),
            )
        ],
        help_text="Network in CIDR notation (e.g., 192.168.1.0/24 or 2001:db8::/32)",
    )
    description = models.TextField(blank=True, null=True)
    group = models.ForeignKey(
        SubnetGroup,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subnets",
        help_text="Subnet group this subnet belongs to",
    )
    location = models.ForeignKey(
        Location,
        on_delete=models.CASCADE,
        related_name="subnets",
        help_text="Location where this subnet is used",
    )
    vlan = models.ForeignKey(
        VLAN,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subnets",
        help_text="Associated VLAN",
    )
    vrf = models.ForeignKey(
        VRF,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subnets",
        help_text="Associated VRF",
    )
    gateway_ip = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="Gateway IP address for this subnet",
    )
    nameservers = models.TextField(
        blank=True,
        null=True,
        help_text="Comma-separated list of nameserver IP addresses or hostnames",
    )
    master_subnet = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="child_subnets",
        help_text="Parent/master subnet this subnet belongs to",
    )
    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subnets",
        help_text="Customer this subnet is assigned to",
    )
    is_ipv6 = models.BooleanField(
        default=False,
        help_text="Whether this is an IPv6 subnet",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="active",
        help_text="Subnet status",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Subnet"
        verbose_name_plural = "Subnets"
        ordering = ["network"]
        unique_together = [["network", "location"]]

    def save(self, *args, **kwargs):
        """Override save to automatically set is_ipv6 based on network."""
        if self.network:
            try:
                net = ipaddress.ip_network(self.network, strict=False)
                self.is_ipv6 = isinstance(net, ipaddress.IPv6Network)
            except (ValueError, TypeError):
                # If network is invalid, keep default value
                pass
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.network} - {self.location}"
