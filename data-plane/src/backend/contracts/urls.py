"""
URL configuration for the contracts app.

Registers the Contract viewset under the default router so that
contracts are available at /api/v1/contracts/ (when included under
core.urls with path api/v1/contracts/).
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ContractViewSet

router = DefaultRouter()
# Register at root so list is GET /api/v1/contracts/, detail is /api/v1/contracts/<id>/
router.register(r"", ContractViewSet, basename="contract")

urlpatterns = [
    path("", include(router.urls)),
]
