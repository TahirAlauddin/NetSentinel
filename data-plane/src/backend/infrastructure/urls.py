from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LocationViewSet,
    CircuitViewSet,
    PointOfContactViewSet,
)

router = DefaultRouter()
router.register(r"locations", LocationViewSet, basename="location")
router.register(r"circuits", CircuitViewSet, basename="circuit")
router.register(
    r"points-of-contact", PointOfContactViewSet, basename="point-of-contact"
)


urlpatterns = [
    path("", include(router.urls)),
]
