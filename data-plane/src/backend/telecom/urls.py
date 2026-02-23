from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DataCircuitViewSet, PhoneNumberViewSet, ProviderViewSet, ServiceViewSet

router = DefaultRouter()
router.register(r"providers", ProviderViewSet, basename="provider")
router.register(r"services", ServiceViewSet, basename="service")
router.register(r"data-circuits", DataCircuitViewSet, basename="data-circuit")
router.register(r"phone-numbers", PhoneNumberViewSet, basename="phone-number")

urlpatterns = [
    path("", include(router.urls)),
]
