from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("notifications", "0004_notificationconfig_related_name_and_inappnotification_user"),
    ]

    operations = [
        migrations.CreateModel(
            name="NotificationReadReceipt",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("read_at", models.DateTimeField(auto_now_add=True)),
                (
                    "notification",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="read_receipts",
                        to="notifications.inappnotification",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="notification_read_receipts",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Notification read receipt",
                "verbose_name_plural": "Notification read receipts",
            },
        ),
        migrations.AddConstraint(
            model_name="notificationreadreceipt",
            constraint=models.UniqueConstraint(
                fields=("user", "notification"),
                name="notifications_readreceipt_user_notification_unique",
            ),
        ),
    ]
