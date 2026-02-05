# Generated manually for contracts app

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Contract",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                (
                    "carrier",
                    models.CharField(
                        help_text="Carrier or service provider name (e.g. AT&T, Verizon).",
                        max_length=255,
                    ),
                ),
                (
                    "contract_number",
                    models.CharField(
                        help_text="Carrier-provided or internal contract identifier.",
                        max_length=100,
                    ),
                ),
                (
                    "date",
                    models.DateField(
                        blank=True,
                        help_text="Contract signing or reference date.",
                        null=True,
                    ),
                ),
                (
                    "nrc",
                    models.DecimalField(
                        decimal_places=2,
                        default=0,
                        help_text="Non-Recurring Charge (one-time).",
                        max_digits=12,
                        validators=[django.core.validators.MinValueValidator(0)],
                    ),
                ),
                (
                    "mrc",
                    models.DecimalField(
                        decimal_places=2,
                        default=0,
                        help_text="Monthly Recurring Charge.",
                        max_digits=12,
                        validators=[django.core.validators.MinValueValidator(0)],
                    ),
                ),
                (
                    "start_date",
                    models.DateField(help_text="Contract term start date."),
                ),
                (
                    "end_date",
                    models.DateField(
                        blank=True,
                        help_text="Contract term end date. Null for ongoing contracts.",
                        null=True,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Contract",
                "verbose_name_plural": "Contracts",
                "ordering": ["carrier", "contract_number"],
            },
        ),
        migrations.AddConstraint(
            model_name="contract",
            constraint=models.UniqueConstraint(
                fields=("carrier", "contract_number"),
                name="contracts_contract_unique_carrier_contract_number",
            ),
        ),
    ]
