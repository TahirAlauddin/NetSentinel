from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("notifications", "0002_rename_notificationchannelconfig_to_notificationconfig"),
    ]

    operations = [
        migrations.CreateModel(
            name="InAppNotification",
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
                ("title", models.CharField(max_length=255)),
                ("message", models.TextField(blank=True)),
                (
                    "type",
                    models.CharField(
                        choices=[
                            ("info", "Info"),
                            ("warning", "Warning"),
                            ("error", "Error"),
                            ("success", "Success"),
                        ],
                        default="info",
                        max_length=20,
                    ),
                ),
                ("link", models.URLField(blank=True, max_length=2000)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "In-app notification",
                "verbose_name_plural": "In-app notifications",
                "ordering": ["-created_at"],
            },
        ),
    ]

