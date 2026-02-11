# Generated for contract categories

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("contracts", "0003_contract_logo"),
    ]

    operations = [
        migrations.CreateModel(
            name="ContractCategory",
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
                ("name", models.CharField(max_length=100, unique=True)),
            ],
            options={
                "verbose_name": "Contract category",
                "verbose_name_plural": "Contract categories",
                "ordering": ["name"],
            },
        ),
        migrations.AddField(
            model_name="contract",
            name="category",
            field=models.ForeignKey(
                blank=True,
                help_text="Contract category (e.g. Telecom, IT and Security).",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="contracts",
                to="contracts.contractcategory",
            ),
        ),
    ]
