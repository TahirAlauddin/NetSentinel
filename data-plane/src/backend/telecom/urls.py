from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DataCircuitViewSet, ProviderViewSet

router = DefaultRouter()
router.register(r"providers", ProviderViewSet, basename="provider")
router.register(r"data-circuits", DataCircuitViewSet, basename="data-circuit")

urlpatterns = [
    path("", include(router.urls)),
]
