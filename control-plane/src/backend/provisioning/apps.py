from django.apps import AppConfig


class ProvisioningConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "provisioning"

    def ready(self):
        import provisioning.signals  # noqa
