from django.apps import AppConfig
from django.db.models.signals import post_migrate


def _seed_execute_remediation_bundle(sender, **kwargs):
    """
    Create the execute_remediation PermissionBundle once RemediationAction's custom
    permission exists. Connected to post_migrate rather than done in a data
    migration: Django creates Meta.permissions entries via its own post_migrate
    receiver (auth.apps.AuthConfig), which — because it's connected earlier, during
    app loading — always runs before this one for the same sender/signal dispatch.
    A migration's RunPython would run too early (before that receiver fires at all).
    """
    from django.contrib.auth.models import Permission

    from users.models import PermissionBundle

    try:
        permission = Permission.objects.get(
            codename="execute_remediationaction", content_type__app_label="remediation"
        )
    except Permission.DoesNotExist:
        return

    bundle, _ = PermissionBundle.objects.get_or_create(
        code="execute_remediation",
        defaults={
            "name": "Execute Remediation Actions",
            "app": "remediation",
            "description": (
                "Allows approving and executing agent-proposed remediation actions "
                "that are awaiting approval."
            ),
        },
    )
    bundle.permissions.add(permission)


class RemediationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "remediation"
    verbose_name = "Incident Response Agent"

    def ready(self):
        post_migrate.connect(_seed_execute_remediation_bundle, sender=self)
