# Generated manually for IP Request feature

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("ipam", "0002_alter_subnet_network_favoritesubnet"),
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="IPRequest",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                (
                    "requested_ip",
                    models.GenericIPAddressField(
                        blank=True,
                        help_text="Specific IP address requested (optional, leave blank for auto-assignment)",
                        null=True,
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("approved", "Approved"),
                            ("rejected", "Rejected"),
                            ("expired", "Expired"),
                            ("completed", "Completed"),
                        ],
                        default="pending",
                        help_text="Request status",
                        max_length=20,
                    ),
                ),
                (
                    "purpose",
                    models.TextField(help_text="Purpose/reason for requesting this IP address"),
                ),
                ("description", models.TextField(blank=True, null=True)),
                (
                    "approval_notes",
                    models.TextField(blank=True, help_text="Notes from approver", null=True),
                ),
                (
                    "approved_at",
                    models.DateTimeField(
                        blank=True, help_text="When the request was approved/rejected", null=True
                    ),
                ),
                (
                    "reservation_expires_at",
                    models.DateTimeField(
                        blank=True, help_text="When the reservation expires (optional)", null=True
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "approved_by",
                    models.ForeignKey(
                        blank=True,
                        help_text="User who approved/rejected this request",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="approved_ip_requests",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "ip_address",
                    models.ForeignKey(
                        blank=True,
                        help_text="IP address created/updated when request is approved",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="ip_requests",
                        to="ipam.ipaddress",
                    ),
                ),
                (
                    "requested_by",
                    models.ForeignKey(
                        help_text="User who requested the IP address",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ip_requests",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "subnet",
                    models.ForeignKey(
                        help_text="Subnet to request IP from",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="ip_requests",
                        to="ipam.subnet",
                    ),
                ),
            ],
            options={
                "verbose_name": "IP Request",
                "verbose_name_plural": "IP Requests",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="iprequest",
            index=models.Index(
                fields=["status", "-created_at"], name="ipam_iprequ_status_created_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="iprequest",
            index=models.Index(
                fields=["requested_by", "-created_at"], name="ipam_iprequ_requested_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="iprequest",
            index=models.Index(fields=["subnet", "status"], name="ipam_iprequ_subnet_status_idx"),
        ),
    ]
