from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ManagedPhoneNumberBlockViewSet, ManagedPhoneNumberViewSet

router = DefaultRouter()
router.register(r"numbers", ManagedPhoneNumberViewSet, basename="managed-phone-number")
router.register(r"blocks", ManagedPhoneNumberBlockViewSet, basename="managed-phone-number-block")

urlpatterns = [
    path("", include(router.urls)),
]
