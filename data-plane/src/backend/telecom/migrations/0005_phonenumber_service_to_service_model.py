# Switch PhoneNumber.service from DataCircuit to Service

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("telecom", "0004_populate_services_from_circuits"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="phonenumber",
            name="service",
        ),
        migrations.RenameField(
            model_name="phonenumber",
            old_name="service_new",
            new_name="service",
        ),
    ]
