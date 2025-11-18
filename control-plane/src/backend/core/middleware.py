"""
Django middleware to add debugging headers for Kubernetes pod/service information.
"""

import os
import socket
from django.utils.deprecation import MiddlewareMixin


class KubernetesDebugMiddleware(MiddlewareMixin):
    """
    Middleware that adds debugging headers to responses containing:
    - Pod name (from HOSTNAME env var)
    - Pod IP (from hostname resolution or request)
    - Service name
    - Request handling information
    """

    def process_response(self, request, response):
        # Get pod name from environment (set via Kubernetes downward API)
        pod_name = os.environ.get("POD_NAME") or os.environ.get("HOSTNAME", "unknown")

        # Get pod IP from environment (set via Kubernetes downward API)
        pod_ip = os.environ.get("POD_IP", "unknown")
        if pod_ip == "unknown":
            # Fallback: try to get from hostname resolution
            try:
                pod_ip = socket.gethostbyname(pod_name)
            except (socket.gaierror, socket.herror):
                pass

        # Get service name from environment or default
        service_name = os.environ.get(
            "SERVICE_NAME", "netsentinel-control-plane-backend"
        )

        # Get the actual pod IP from the request if available
        # In Kubernetes, we can also check X-Forwarded-For or other headers
        client_ip = request.META.get(
            "HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR", "unknown")
        )
        if "," in client_ip:
            client_ip = client_ip.split(",")[0].strip()

        # Add debugging headers
        response["X-Pod-Name"] = pod_name
        response["X-Pod-IP"] = pod_ip
        response["X-Service-Name"] = service_name
        response["X-Client-IP"] = client_ip
        response["X-Request-Path"] = request.path
        response["X-Request-Method"] = request.method

        return response
