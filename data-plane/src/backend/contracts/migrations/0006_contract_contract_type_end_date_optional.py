# Add contract_type; make end_date optional for Monthly contracts

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("contracts", "0005_contract_end_date_required"),
    ]

    operations = [
        migrations.AddField(
            model_name="contract",
            name="contract_type",
            field=models.CharField(
                choices=[("fixed_term", "Fixed Term"), ("monthly", "Monthly")],
                default="fixed_term",
                help_text="Fixed Term has defined end date; Monthly is ongoing.",
                max_length=20,
            ),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name="contract",
            name="end_date",
            field=models.DateField(
                blank=True,
                null=True,
                help_text="Contract term end date. Required for Fixed Term; optional for Monthly.",
            ),
        ),
    ]
