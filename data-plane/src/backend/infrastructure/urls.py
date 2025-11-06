from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LocationViewSet,
    CircuitViewSet,
    PointOfContactViewSet,
    DepartmentViewSet,
    CategoryViewSet,
)

router = DefaultRouter()
router.register(r"locations", LocationViewSet, basename="location")
router.register(r"circuits", CircuitViewSet, basename="circuit")
router.register(
    r"points-of-contact", PointOfContactViewSet, basename="point-of-contact"
)
router.register(r"departments", DepartmentViewSet, basename="department")
router.register(r"categories", CategoryViewSet, basename="category")

urlpatterns = [
    path("", include(router.urls)),
]
