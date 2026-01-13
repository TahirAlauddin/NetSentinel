"""
Network Scan Models.

Models for network scanning and discovery functionality.
"""

from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone

from .subnet import Subnet

User = get_user_model()


class NetworkScan(models.Model):
    """
    Model for network scan jobs.
    
    Represents a scan operation on a subnet to discover active hosts.
    """

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("running", "Running"),
        ("completed", "Completed"),
        ("failed", "Failed"),
        ("cancelled", "Cancelled"),
    ]

    SCAN_TYPE_CHOICES = [
        ("ping", "Ping/ICMP"),
        ("arp", "ARP"),
        ("tcp", "TCP Port Scan"),
        ("full", "Full Scan"),
    ]

    subnet = models.ForeignKey(
        Subnet,
        on_delete=models.CASCADE,
        related_name="network_scans",
        help_text="Subnet to scan",
    )
    scan_type = models.CharField(
        max_length=20,
        choices=SCAN_TYPE_CHOICES,
        default="ping",
        help_text="Type of scan to perform",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
        help_text="Scan status",
    )
    started_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="network_scans",
        help_text="User who initiated the scan",
    )
    
    # Scan configuration
    timeout = models.IntegerField(
        default=3,
        help_text="Timeout in seconds for each host",
    )
    max_hosts = models.IntegerField(
        null=True,
        blank=True,
        help_text="Maximum number of hosts to scan (null = all)",
    )
    
    # Scan results summary
    hosts_found = models.IntegerField(
        default=0,
        help_text="Number of hosts discovered",
    )
    hosts_new = models.IntegerField(
        default=0,
        help_text="Number of new hosts not in IPAM",
    )
    hosts_missing = models.IntegerField(
        default=0,
        help_text="Number of IPAM hosts not found in scan",
    )
    
    # Timestamps
    started_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the scan started",
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the scan completed",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Error information
    error_message = models.TextField(
        blank=True,
        null=True,
        help_text="Error message if scan failed",
    )

    class Meta:
        verbose_name = "Network Scan"
        verbose_name_plural = "Network Scans"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["subnet", "-created_at"]),
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["started_by", "-created_at"]),
        ]

    def __str__(self):
        return f"Scan {self.id} - {self.subnet.network} ({self.get_status_display()})"

    @property
    def duration(self):
        """Calculate scan duration in seconds."""
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        return None


class ScanResult(models.Model):
    """
    Model for individual scan results.
    
    Represents a discovered host from a network scan.
    """

    scan = models.ForeignKey(
        NetworkScan,
        on_delete=models.CASCADE,
        related_name="results",
        help_text="Network scan this result belongs to",
    )
    ip_address = models.GenericIPAddressField(
        help_text="IP address discovered",
    )
    
    # Discovery information
    is_active = models.BooleanField(
        default=True,
        help_text="Whether the host responded to the scan",
    )
    response_time = models.FloatField(
        null=True,
        blank=True,
        help_text="Response time in milliseconds",
    )
    mac_address = models.CharField(
        max_length=17,
        blank=True,
        null=True,
        help_text="MAC address if discovered",
    )
    hostname = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Hostname if discovered",
    )
    vendor = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Vendor from MAC address lookup",
    )
    
    # IPAM comparison
    in_ipam = models.BooleanField(
        default=False,
        help_text="Whether this IP exists in IPAM",
    )
    ipam_status = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Status in IPAM if exists",
    )
    
    # Additional information
    open_ports = models.JSONField(
        default=list,
        blank=True,
        help_text="List of open ports if TCP scan",
    )
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Additional notes about this host",
    )
    
    discovered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Scan Result"
        verbose_name_plural = "Scan Results"
        ordering = ["ip_address"]
        indexes = [
            models.Index(fields=["scan", "ip_address"]),
            models.Index(fields=["is_active", "in_ipam"]),
        ]
        unique_together = [["scan", "ip_address"]]

    def __str__(self):
        return f"{self.ip_address} - {self.scan}"
