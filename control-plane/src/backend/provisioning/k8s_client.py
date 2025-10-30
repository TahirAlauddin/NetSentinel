"""
Kubernetes client wrapper for tenant provisioning.
"""

import os
import logging
from kubernetes import client, config
from kubernetes.client.rest import ApiException
from django.conf import settings

logger = logging.getLogger(__name__)


class KubernetesClient:
    """Wrapper for Kubernetes API client operations."""

    def __init__(self):
        """Initialize Kubernetes client based on environment."""
        self._client = None
        self._apps_v1 = None
        self._core_v1 = None
        self._initialize_client()

    def _initialize_client(self):
        """Initialize Kubernetes client configuration."""
        try:
            if settings.K8S_IN_CLUSTER:
                # Running inside Kubernetes cluster
                config.load_incluster_config()
                logger.info("Loaded in-cluster Kubernetes config")
            else:
                # Running outside cluster (dev mode)
                kubeconfig_path = settings.KUBECONFIG
                if kubeconfig_path and os.path.exists(kubeconfig_path):
                    config.load_kube_config(config_file=kubeconfig_path)
                    logger.info(f"Loaded Kubernetes config from {kubeconfig_path}")
                else:
                    # Try default kubeconfig location
                    config.load_kube_config()
                    logger.info("Loaded Kubernetes config from default location")
        except Exception as e:
            logger.error(f"Failed to load Kubernetes config: {e}")
            raise

        self._client = client.ApiClient()
        self._apps_v1 = client.AppsV1Api(self._client)
        self._core_v1 = client.CoreV1Api(self._client)

    def namespace_exists(self, namespace: str) -> bool:
        """Check if a namespace exists."""
        try:
            self._core_v1.read_namespace(name=namespace)
            return True
        except ApiException as e:
            if e.status == 404:
                return False
            raise

    def create_namespace(self, namespace: str, labels: dict = None) -> bool:
        """Create a Kubernetes namespace."""
        if self.namespace_exists(namespace):
            logger.info(f"Namespace {namespace} already exists")
            return False

        namespace_body = client.V1Namespace(
            metadata=client.V1ObjectMeta(
                name=namespace,
                labels=labels or {},
            )
        )

        try:
            self._core_v1.create_namespace(body=namespace_body)
            logger.info(f"Created namespace: {namespace}")
            return True
        except ApiException as e:
            if e.status == 409:  # Already exists
                logger.info(f"Namespace {namespace} already exists")
                return False
            logger.error(f"Failed to create namespace {namespace}: {e}")
            raise

    def create_config_map(
        self, namespace: str, name: str, data: dict, labels: dict = None
    ) -> bool:
        """Create a ConfigMap in the specified namespace."""
        config_map = client.V1ConfigMap(
            metadata=client.V1ObjectMeta(
                name=name,
                namespace=namespace,
                labels=labels or {},
            ),
            data=data,
        )

        try:
            self._core_v1.create_namespaced_config_map(
                namespace=namespace, body=config_map
            )
            logger.info(f"Created ConfigMap {name} in namespace {namespace}")
            return True
        except ApiException as e:
            if e.status == 409:  # Already exists
                logger.info(f"ConfigMap {name} already exists, updating...")
                self._core_v1.patch_namespaced_config_map(
                    name=name, namespace=namespace, body=config_map
                )
                return False
            logger.error(
                f"Failed to create ConfigMap {name} in namespace {namespace}: {e}"
            )
            raise

    def create_secret(
        self, namespace: str, name: str, string_data: dict, labels: dict = None
    ) -> bool:
        """Create a Secret in the specified namespace."""
        secret = client.V1Secret(
            metadata=client.V1ObjectMeta(
                name=name,
                namespace=namespace,
                labels=labels or {},
            ),
            type="Opaque",
            string_data=string_data,
        )

        try:
            self._core_v1.create_namespaced_secret(namespace=namespace, body=secret)
            logger.info(f"Created Secret {name} in namespace {namespace}")
            return True
        except ApiException as e:
            if e.status == 409:  # Already exists
                logger.info(f"Secret {name} already exists, updating...")
                self._core_v1.patch_namespaced_secret(
                    name=name, namespace=namespace, body=secret
                )
                return False
            logger.error(
                f"Failed to create Secret {name} in namespace {namespace}: {e}"
            )
            raise

    def create_deployment(
        self, namespace: str, deployment_body: client.V1Deployment
    ) -> bool:
        """Create a Deployment in the specified namespace."""
        try:
            self._apps_v1.create_namespaced_deployment(
                namespace=namespace, body=deployment_body
            )
            logger.info(
                f"Created Deployment {deployment_body.metadata.name} in namespace {namespace}"
            )
            return True
        except ApiException as e:
            if e.status == 409:  # Already exists
                logger.info(
                    f"Deployment {deployment_body.metadata.name} already exists, updating..."
                )
                self._apps_v1.patch_namespaced_deployment(
                    name=deployment_body.metadata.name,
                    namespace=namespace,
                    body=deployment_body,
                )
                return False
            logger.error(
                f"Failed to create Deployment {deployment_body.metadata.name} in namespace {namespace}: {e}"
            )
            raise

    def create_service(self, namespace: str, service_body: client.V1Service) -> bool:
        """Create a Service in the specified namespace."""
        try:
            self._core_v1.create_namespaced_service(
                namespace=namespace, body=service_body
            )
            logger.info(
                f"Created Service {service_body.metadata.name} in namespace {namespace}"
            )
            return True
        except ApiException as e:
            if e.status == 409:  # Already exists
                logger.info(
                    f"Service {service_body.metadata.name} already exists, updating..."
                )
                self._core_v1.patch_namespaced_service(
                    name=service_body.metadata.name,
                    namespace=namespace,
                    body=service_body,
                )
                return False
            logger.error(
                f"Failed to create Service {service_body.metadata.name} in namespace {namespace}: {e}"
            )
            raise

    def get_deployment_status(self, namespace: str, name: str) -> dict:
        """Get the status of a deployment."""
        try:
            deployment = self._apps_v1.read_namespaced_deployment(
                name=name, namespace=namespace
            )
            return {
                "ready": deployment.status.ready_replicas or 0,
                "desired": deployment.spec.replicas,
                "available": deployment.status.available_replicas or 0,
                "updated": deployment.status.updated_replicas or 0,
            }
        except ApiException as e:
            logger.error(f"Failed to get deployment status: {e}")
            return {"ready": 0, "desired": 0, "available": 0, "updated": 0}
