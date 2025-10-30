from django.db import models
from django.core.validators import MinLengthValidator
from users.models import Company
import uuid


class ProvisioningStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    IN_PROGRESS = "in_progress", "In Progress"
    COMPLETED = "completed", "Completed"
    FAILED = "failed", "Failed"


class TenantProvisioning(models.Model):
    """
    Tracks the provisioning status of a tenant in Kubernetes.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.OneToOneField(
        Company,
        on_delete=models.CASCADE,
        related_name="provisioning",
        help_text="The company/tenant being provisioned",
    )
    status = models.CharField(
        max_length=20,
        choices=ProvisioningStatus.choices,
        default=ProvisioningStatus.PENDING,
        help_text="Current provisioning status",
    )
    namespace_name = models.CharField(
        max_length=63,
        unique=True,
        validators=[MinLengthValidator(1)],
        help_text="Kubernetes namespace name for this tenant",
    )
    error_message = models.TextField(
        blank=True,
        null=True,
        help_text="Error message if provisioning failed",
    )
    logs = models.TextField(
        blank=True,
        null=True,
        help_text="Provisioning logs for debugging",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "provisioning_tenantprovisioning"
        verbose_name = "Tenant Provisioning"
        verbose_name_plural = "Tenant Provisionings"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.company.name} - {self.status}"
