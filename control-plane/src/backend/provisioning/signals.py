"""
Django signals for tenant provisioning.
"""

import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from users.models import Company
from .tasks import provision_tenant

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Company)
def trigger_tenant_provisioning(sender, instance, created, **kwargs):
    """
    Automatically trigger tenant provisioning when a Company is created.
    """
    if created:
        logger.info(f"Company {instance.name} created, triggering provisioning...")
        # Trigger provisioning task asynchronously
        provision_tenant.delay(str(instance.id), force=False)
    else:
        logger.debug(
            f"Company {instance.name} updated (not created), skipping provisioning"
        )
