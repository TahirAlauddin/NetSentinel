"""
Health check endpoint for monitoring and load balancers.
"""

from django.http import JsonResponse
from django.db import connection
from django.conf import settings


def health_check(request):
    """
    Simple health check endpoint.
    Returns 200 if the service is healthy, 503 otherwise.
    """
    try:
        # Check database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()

        return JsonResponse(
            {
                "status": "healthy",
                "service": "netsentinel-backend",
                "debug": settings.DEBUG,
            },
            status=200,
        )
    except Exception as e:
        return JsonResponse(
            {
                "status": "unhealthy",
                "service": "netsentinel-backend",
                "error": str(e),
            },
            status=503,
        )
