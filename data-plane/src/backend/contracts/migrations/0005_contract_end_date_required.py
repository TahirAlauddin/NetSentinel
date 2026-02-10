# Make end_date required: backfill nulls with start_date, then alter field

from django.db import migrations, models


def backfill_null_end_dates(apps, schema_editor):
    Contract = apps.get_model("contracts", "Contract")
    from datetime import timedelta
    for c in Contract.objects.filter(end_date__isnull=True):
        c.end_date = c.start_date + timedelta(days=365)
        c.save()


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("contracts", "0004_contractcategory_contract_category"),
    ]

    operations = [
        migrations.RunPython(backfill_null_end_dates, noop),
        migrations.AlterField(
            model_name="contract",
            name="end_date",
            field=models.DateField(
                help_text="Contract term end date.",
            ),
        ),
    ]
