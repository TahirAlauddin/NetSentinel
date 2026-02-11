# Generated manually for Service vs DataCircuit separation

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("infrastructure", "0004_remove_carriercontact_address1_and_more"),
        ("telecom", "0002_phonenumber"),
    ]

    operations = [
        migrations.CreateModel(
            name="Service",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "name",
                    models.CharField(help_text="Display name for the service", max_length=255),
                ),
                (
                    "service_category",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("data", "Data"),
                            ("voice", "Voice"),
                            ("internet", "Internet"),
                            ("mobile", "Mobile"),
                            ("consolidated", "Consolidated"),
                        ],
                        max_length=20,
                        null=True,
                    ),
                ),
                (
                    "service_type",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("broadband", "Broadband"),
                            ("dia", "DIA"),
                            ("satellite", "Satellite"),
                            ("lte_wireless", "LTE Wireless"),
                            ("ptp_wireless", "PTP Wireless"),
                            ("mpls", "MPLS"),
                            ("pri", "PRI"),
                            ("sip", "SIP"),
                            ("other", "Other"),
                        ],
                        max_length=20,
                        null=True,
                    ),
                ),
                (
                    "associated_product",
                    models.CharField(blank=True, max_length=255, null=True),
                ),
                (
                    "account_number",
                    models.CharField(blank=True, max_length=255, null=True),
                ),
                (
                    "security_code",
                    models.CharField(
                        blank=True,
                        help_text="Pin",
                        max_length=255,
                        null=True,
                    ),
                ),
                (
                    "contract_id",
                    models.CharField(blank=True, max_length=255, null=True),
                ),
                (
                    "monthly_cost",
                    models.DecimalField(
                        blank=True,
                        decimal_places=2,
                        help_text="Monthly cost in dollars",
                        max_digits=10,
                        null=True,
                    ),
                ),
                ("notes", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "location",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="telecom_services",
                        to="infrastructure.location",
                    ),
                ),
                (
                    "provider",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="services",
                        to="telecom.provider",
                    ),
                ),
            ],
            options={
                "verbose_name": "Service",
                "verbose_name_plural": "Services",
                "ordering": ["name"],
            },
        ),
        migrations.AddField(
            model_name="datacircuit",
            name="service",
            field=models.ForeignKey(
                blank=True,
                help_text="Business service this circuit supports (if any)",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="data_circuits",
                to="telecom.service",
            ),
        ),
        migrations.AddField(
            model_name="phonenumber",
            name="service_new",
            field=models.ForeignKey(
                blank=True,
                help_text="Associated business service (will become 'service' after migration).",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="phone_numbers",
                to="telecom.service",
            ),
        ),
    ]
