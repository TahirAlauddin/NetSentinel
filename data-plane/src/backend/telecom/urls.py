from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProviderViewSet, DataCircuitViewSet

router = DefaultRouter()
router.register(r"providers", ProviderViewSet, basename="provider")
router.register(r"data-circuits", DataCircuitViewSet, basename="data-circuit")

urlpatterns = [
    path("", include(router.urls)),
]

