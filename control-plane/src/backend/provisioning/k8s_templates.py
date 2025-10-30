"""
Kubernetes manifest templates for tenant provisioning.
"""

import secrets
import string
from kubernetes import client
from django.conf import settings


def generate_secret_key() -> str:
    """Generate a secure Django secret key."""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return "".join(secrets.choice(alphabet) for _ in range(50))


def generate_namespace_name(company_id: str, company_name: str) -> str:
    """Generate a valid Kubernetes namespace name from company info."""
    # Kubernetes namespace names must be lowercase alphanumeric with hyphens
    # Max 63 characters
    prefix = settings.K8S_NAMESPACE_PREFIX
    # Use company_id (UUID) for uniqueness, sanitize company name for readability
    sanitized_name = "".join(
        c if c.isalnum() or c == "-" else "-" for c in company_name.lower()
    )[:20]
    namespace = f"{prefix}-{sanitized_name}-{str(company_id)[:8]}"
    # Ensure it's valid (lowercase, alphanumeric, hyphens only, max 63 chars)
    namespace = namespace.lower()[:63].rstrip("-")
    return namespace


def create_backend_deployment(
    namespace: str,
    company_id: str,
    image: str = None,
    replicas: int = 1,
    resource_limits: dict = None,
) -> client.V1Deployment:
    """Create a backend Deployment manifest."""
    if image is None:
        image = settings.DATA_PLANE_BACKEND_IMAGE

    if resource_limits is None:
        resource_limits = {
            "requests": {"memory": "256Mi", "cpu": "100m"},
            "limits": {"memory": "512Mi", "cpu": "500m"},
        }

    # Generate tenant-specific secret key
    django_secret_key = generate_secret_key()

    deployment = client.V1Deployment(
        api_version="apps/v1",
        kind="Deployment",
        metadata=client.V1ObjectMeta(
            name=f"{namespace}-backend",
            namespace=namespace,
            labels={
                "app": "netsentinel-backend",
                "tenant": company_id,
                "component": "backend",
            },
        ),
        spec=client.V1DeploymentSpec(
            replicas=replicas,
            selector=client.V1LabelSelector(
                match_labels={
                    "app": "netsentinel-backend",
                    "tenant": company_id,
                }
            ),
            template=client.V1PodTemplateSpec(
                metadata=client.V1ObjectMeta(
                    labels={
                        "app": "netsentinel-backend",
                        "tenant": company_id,
                        "component": "backend",
                    }
                ),
                spec=client.V1PodSpec(
                    containers=[
                        client.V1Container(
                            name="backend",
                            image=image,
                            image_pull_policy="Always",
                            ports=[
                                client.V1ContainerPort(
                                    container_port=8000,
                                    protocol="TCP",
                                )
                            ],
                            env=[
                                client.V1EnvVar(
                                    name="POD_NAME",
                                    value_from=client.V1EnvVarSource(
                                        field_ref=client.V1ObjectFieldSelector(
                                            field_path="metadata.name"
                                        )
                                    ),
                                ),
                                client.V1EnvVar(
                                    name="POD_IP",
                                    value_from=client.V1EnvVarSource(
                                        field_ref=client.V1ObjectFieldSelector(
                                            field_path="status.podIP"
                                        )
                                    ),
                                ),
                                client.V1EnvVar(
                                    name="SERVICE_NAME",
                                    value="netsentinel-backend",
                                ),
                                client.V1EnvVar(
                                    name="HOSTNAME",
                                    value_from=client.V1EnvVarSource(
                                        field_ref=client.V1ObjectFieldSelector(
                                            field_path="metadata.name"
                                        )
                                    ),
                                ),
                                client.V1EnvVar(
                                    name="DJANGO_SECRET_KEY",
                                    value_from=client.V1EnvVarSource(
                                        secret_key_ref=client.V1SecretKeySelector(
                                            name="django-secret",
                                            key="django-secret-key",
                                        )
                                    ),
                                ),
                                client.V1EnvVar(
                                    name="DEBUG",
                                    value="False",
                                ),
                                client.V1EnvVar(
                                    name="ALLOWED_HOSTS",
                                    value="*",
                                ),
                                client.V1EnvVar(
                                    name="CORS_ALLOWED_ORIGINS",
                                    value="*",
                                ),
                                client.V1EnvVar(
                                    name="POSTGRES_HOST",
                                    value="postgres",
                                ),
                                client.V1EnvVar(
                                    name="POSTGRES_PORT",
                                    value="5432",
                                ),
                                client.V1EnvVar(
                                    name="POSTGRES_NAME",
                                    value_from=client.V1EnvVarSource(
                                        secret_key_ref=client.V1SecretKeySelector(
                                            name="postgres-secret",
                                            key="postgres-db",
                                        )
                                    ),
                                ),
                                client.V1EnvVar(
                                    name="POSTGRES_USER",
                                    value_from=client.V1EnvVarSource(
                                        secret_key_ref=client.V1SecretKeySelector(
                                            name="postgres-secret",
                                            key="postgres-user",
                                        )
                                    ),
                                ),
                                client.V1EnvVar(
                                    name="POSTGRES_PASSWORD",
                                    value_from=client.V1EnvVarSource(
                                        secret_key_ref=client.V1SecretKeySelector(
                                            name="postgres-secret",
                                            key="postgres-password",
                                        )
                                    ),
                                ),
                            ],
                            resources=client.V1ResourceRequirements(**resource_limits),
                        )
                    ],
                ),
            ),
        ),
    )

    return deployment


def create_frontend_deployment(
    namespace: str,
    company_id: str,
    image: str = None,
    replicas: int = 1,
    resource_limits: dict = None,
    api_url: str = None,
    nextauth_url: str = None,
) -> client.V1Deployment:
    """Create a frontend Deployment manifest."""
    if image is None:
        image = settings.DATA_PLANE_FRONTEND_IMAGE

    if resource_limits is None:
        resource_limits = {
            "requests": {"memory": "128Mi", "cpu": "50m"},
            "limits": {"memory": "256Mi", "cpu": "200m"},
        }

    deployment = client.V1Deployment(
        api_version="apps/v1",
        kind="Deployment",
        metadata=client.V1ObjectMeta(
            name=f"{namespace}-frontend",
            namespace=namespace,
            labels={
                "app": "netsentinel-frontend",
                "tenant": company_id,
                "component": "frontend",
            },
        ),
        spec=client.V1DeploymentSpec(
            replicas=replicas,
            selector=client.V1LabelSelector(
                match_labels={
                    "app": "netsentinel-frontend",
                    "tenant": company_id,
                }
            ),
            template=client.V1PodTemplateSpec(
                metadata=client.V1ObjectMeta(
                    labels={
                        "app": "netsentinel-frontend",
                        "tenant": company_id,
                        "component": "frontend",
                    }
                ),
                spec=client.V1PodSpec(
                    containers=[
                        client.V1Container(
                            name="frontend",
                            image=image,
                            ports=[
                                client.V1ContainerPort(
                                    container_port=3000,
                                    protocol="TCP",
                                )
                            ],
                            env=[
                                client.V1EnvVar(
                                    name="NEXTAUTH_URL",
                                    value_from=client.V1EnvVarSource(
                                        config_map_key_ref=client.V1ConfigMapKeySelector(
                                            name="netsentinel-config",
                                            key="nextauth-url",
                                        )
                                    ),
                                ),
                                client.V1EnvVar(
                                    name="NEXT_PUBLIC_API_URL",
                                    value_from=client.V1EnvVarSource(
                                        config_map_key_ref=client.V1ConfigMapKeySelector(
                                            name="netsentinel-config",
                                            key="api-url",
                                        )
                                    ),
                                ),
                                client.V1EnvVar(
                                    name="NEXTAUTH_SECRET",
                                    value_from=client.V1EnvVarSource(
                                        secret_key_ref=client.V1SecretKeySelector(
                                            name="netsentinel-secrets",
                                            key="nextauth-secret",
                                        )
                                    ),
                                ),
                            ],
                            resources=client.V1ResourceRequirements(**resource_limits),
                        )
                    ],
                ),
            ),
        ),
    )

    return deployment


def create_backend_service(namespace: str, company_id: str) -> client.V1Service:
    """Create a backend Service manifest."""
    service = client.V1Service(
        api_version="v1",
        kind="Service",
        metadata=client.V1ObjectMeta(
            name="netsentinel-backend",
            namespace=namespace,
            labels={
                "app": "netsentinel-backend",
                "tenant": company_id,
            },
        ),
        spec=client.V1ServiceSpec(
            selector={
                "app": "netsentinel-backend",
                "tenant": company_id,
            },
            ports=[
                client.V1ServicePort(
                    port=8000,
                    target_port=8000,
                    protocol="TCP",
                )
            ],
            type="ClusterIP",
        ),
    )
    return service


def create_frontend_service(namespace: str, company_id: str) -> client.V1Service:
    """Create a frontend Service manifest."""
    service = client.V1Service(
        api_version="v1",
        kind="Service",
        metadata=client.V1ObjectMeta(
            name="netsentinel-frontend",
            namespace=namespace,
            labels={
                "app": "netsentinel-frontend",
                "tenant": company_id,
            },
        ),
        spec=client.V1ServiceSpec(
            selector={
                "app": "netsentinel-frontend",
                "tenant": company_id,
            },
            ports=[
                client.V1ServicePort(
                    port=80,
                    target_port=3000,
                    protocol="TCP",
                )
            ],
            type="ClusterIP",
        ),
    )
    return service


def create_tenant_config_map(namespace: str, api_url: str, nextauth_url: str) -> dict:
    """Create ConfigMap data for tenant."""
    return {
        "api-url": api_url,
        "nextauth-url": nextauth_url,
    }


def create_tenant_secrets(
    django_secret_key: str,
    postgres_password: str,
    postgres_user: str = "netsentinel",
    postgres_db: str = None,
    nextauth_secret: str = None,
) -> dict:
    """Create Secrets data for tenant."""
    if postgres_db is None:
        postgres_db = "netsentinel_db"

    if nextauth_secret is None:
        nextauth_secret = generate_secret_key()[:32]

    return {
        "django-secret": {
            "django-secret-key": django_secret_key,
        },
        "postgres-secret": {
            "postgres-password": postgres_password,
            "postgres-user": postgres_user,
            "postgres-db": postgres_db,
        },
        "netsentinel-secrets": {
            "nextauth-secret": nextauth_secret,
        },
    }
