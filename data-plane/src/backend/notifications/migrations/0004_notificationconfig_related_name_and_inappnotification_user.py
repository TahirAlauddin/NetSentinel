from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("notifications", "0003_inappnotification"),
    ]

    operations = [
        migrations.AlterField(
            model_name="notificationconfig",
            name="user",
            field=models.OneToOneField(
                blank=True,
                help_text="If null, this is the system-wide default config.",
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="notification_config",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="inappnotification",
            name="user",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="in_app_notifications",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]

