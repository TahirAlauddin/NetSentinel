from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LocationViewSet,
    CircuitViewSet,
    PointOfContactViewSet,
    DepartmentViewSet,
    CategoryViewSet,
    ContactViewSet,
    CarrierContactViewSet,
    UtilityContactViewSet,
)

router = DefaultRouter()
router.register(r"locations", LocationViewSet, basename="location")
router.register(r"circuits", CircuitViewSet, basename="circuit")
router.register(
    r"points-of-contact", PointOfContactViewSet, basename="point-of-contact"
)
router.register(r"departments", DepartmentViewSet, basename="department")
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"contacts", ContactViewSet, basename="contact")
router.register(r"carrier-contacts", CarrierContactViewSet, basename="carrier-contact")
router.register(r"utility-contacts", UtilityContactViewSet, basename="utility-contact")

urlpatterns = [
    path("", include(router.urls)),
]
