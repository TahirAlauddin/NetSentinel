"""
Celery tasks for tenant provisioning.
"""
import logging
import secrets
import string
from celery import shared_task
from django.utils import timezone
from django.conf import settings
from .models import TenantProvisioning, ProvisioningStatus
from .k8s_client import KubernetesClient
from .k8s_templates import (
    generate_namespace_name,
    create_backend_deployment,
    create_frontend_deployment,
    create_backend_service,
    create_frontend_service,
    create_tenant_config_map,
    create_tenant_secrets,
    generate_secret_key,
)

logger = logging.getLogger(__name__)


def generate_password(length: int = 16) -> str:
    """Generate a secure random password."""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return "".join(secrets.choice(alphabet) for _ in range(length))


@shared_task(bind=True, max_retries=3)
def provision_tenant(self, company_id: str, force: bool = False):
    """
    Provision a tenant in Kubernetes.

    Args:
        company_id: UUID of the Company to provision
        force: If True, re-provision even if already provisioned
    """
    from users.models import Company

    try:
        company = Company.objects.get(id=company_id)
    except Company.DoesNotExist:
        logger.error(f"Company {company_id} not found")
        return {"status": "error", "message": f"Company {company_id} not found"}

    # Get or create TenantProvisioning record
    namespace_name = generate_namespace_name(str(company.id), company.name)
    provisioning, created = TenantProvisioning.objects.get_or_create(
        company=company,
        defaults={
            "namespace_name": namespace_name,
            "status": ProvisioningStatus.PENDING,
        },
    )
    
    # Update namespace if it wasn't set
    if not provisioning.namespace_name:
        provisioning.namespace_name = namespace_name
        provisioning.save()

    # If already completed and not forcing, skip
    if (
        provisioning.status == ProvisioningStatus.COMPLETED
        and not force
        and not created
    ):
        logger.info(
            f"Tenant {company.name} already provisioned. Use force=True to re-provision."
        )
        return {
            "status": "skipped",
            "message": "Tenant already provisioned",
            "namespace": provisioning.namespace_name,
        }

    # Update status to in_progress
    provisioning.status = ProvisioningStatus.IN_PROGRESS
    provisioning.error_message = None
    provisioning.logs = ""
    provisioning.save()

    log_message = f"Starting provisioning for tenant {company.name} (ID: {company_id})"
    logger.info(log_message)
    provisioning.logs = f"{provisioning.logs or ''}\n{log_message}"
    provisioning.save()

    try:
        k8s_client = KubernetesClient()
        namespace = provisioning.namespace_name

        # Step 1: Create namespace
        log_message = f"Creating namespace: {namespace}"
        logger.info(log_message)
        provisioning.logs = f"{provisioning.logs}\n{log_message}"
        provisioning.save()

        k8s_client.create_namespace(
            namespace,
            labels={
                "tenant": str(company.id),
                "company": company.name,
                "managed-by": "netsentinel-control-plane",
            },
        )

        # Step 2: Generate secrets
        log_message = "Generating secrets..."
        logger.info(log_message)
        provisioning.logs = f"{provisioning.logs}\n{log_message}"
        provisioning.save()

        django_secret_key = generate_secret_key()
        postgres_password = generate_password()
        nextauth_secret = generate_secret_key()[:32]

        secrets_data = create_tenant_secrets(
            django_secret_key=django_secret_key,
            postgres_password=postgres_password,
            postgres_user="netsentinel",
            postgres_db=f"netsentinel_{str(company.id)[:8]}",
            nextauth_secret=nextauth_secret,
        )

        # Step 3: Create Secrets
        log_message = "Creating Kubernetes secrets..."
        logger.info(log_message)
        provisioning.logs = f"{provisioning.logs}\n{log_message}"
        provisioning.save()

        for secret_name, secret_data in secrets_data.items():
            k8s_client.create_secret(
                namespace=namespace,
                name=secret_name,
                string_data=secret_data,
                labels={"tenant": str(company.id)},
            )

        # Step 4: Create ConfigMap
        # For now, use placeholder URLs - these should be configured based on ingress/subdomain
        api_url = f"http://{namespace}.local/api/v1"  # Placeholder
        nextauth_url = f"http://{namespace}.local"  # Placeholder

        log_message = "Creating ConfigMap..."
        logger.info(log_message)
        provisioning.logs = f"{provisioning.logs}\n{log_message}"
        provisioning.save()

        config_map_data = create_tenant_config_map(
            namespace=namespace,
            api_url=api_url,
            nextauth_url=nextauth_url,
        )
        k8s_client.create_config_map(
            namespace=namespace,
            name="netsentinel-config",
            data=config_map_data,
            labels={"tenant": str(company.id)},
        )

        # Step 5: Create backend deployment
        log_message = "Creating backend deployment..."
        logger.info(log_message)
        provisioning.logs = f"{provisioning.logs}\n{log_message}"
        provisioning.save()

        backend_deployment = create_backend_deployment(
            namespace=namespace,
            company_id=str(company.id),
            image=settings.DATA_PLANE_BACKEND_IMAGE,
            replicas=1,
        )
        k8s_client.create_deployment(namespace=namespace, deployment_body=backend_deployment)

        # Step 6: Create backend service
        log_message = "Creating backend service..."
        logger.info(log_message)
        provisioning.logs = f"{provisioning.logs}\n{log_message}"
        provisioning.save()

        backend_service = create_backend_service(
            namespace=namespace, company_id=str(company.id)
        )
        k8s_client.create_service(namespace=namespace, service_body=backend_service)

        # Step 7: Create frontend deployment
        log_message = "Creating frontend deployment..."
        logger.info(log_message)
        provisioning.logs = f"{provisioning.logs}\n{log_message}"
        provisioning.save()

        frontend_deployment = create_frontend_deployment(
            namespace=namespace,
            company_id=str(company.id),
            image=settings.DATA_PLANE_FRONTEND_IMAGE,
            replicas=1,
        )
        k8s_client.create_deployment(
            namespace=namespace, deployment_body=frontend_deployment
        )

        # Step 8: Create frontend service
        log_message = "Creating frontend service..."
        logger.info(log_message)
        provisioning.logs = f"{provisioning.logs}\n{log_message}"
        provisioning.save()

        frontend_service = create_frontend_service(
            namespace=namespace, company_id=str(company.id)
        )
        k8s_client.create_service(namespace=namespace, service_body=frontend_service)

        # Step 9: Mark as completed
        log_message = "Provisioning completed successfully!"
        logger.info(log_message)
        provisioning.status = ProvisioningStatus.COMPLETED
        provisioning.completed_at = timezone.now()
        provisioning.logs = f"{provisioning.logs}\n{log_message}"
        provisioning.save()

        return {
            "status": "success",
            "message": "Tenant provisioned successfully",
            "namespace": namespace,
            "company_id": str(company.id),
        }

    except Exception as e:
        error_message = f"Provisioning failed: {str(e)}"
        logger.error(error_message, exc_info=True)
        provisioning.status = ProvisioningStatus.FAILED
        provisioning.error_message = str(e)
        provisioning.logs = f"{provisioning.logs or ''}\n{error_message}"
        provisioning.save()

        # Retry on transient errors
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=60 * (self.request.retries + 1))

        return {
            "status": "error",
            "message": error_message,
            "namespace": provisioning.namespace_name,
        }

