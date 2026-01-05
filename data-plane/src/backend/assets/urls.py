from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers

from .views import (AssetAttachmentViewSet, AssetBasicDetailsViewSet,
                    AssetCategoryViewSet, AssetImageViewSet,
                    AssetRelationDirectViewSet, AssetRelationViewSet,
                    AssetTagViewSet, AssetTechSpecsViewSet, AssetViewSet,
                    CalendarAlertViewSet, ComputerDetailsViewSet,
                    CustomLifecycleViewSet, DisplayDetailsViewSet,
                    NetworkDetailsViewSet, PeripheralDetailsViewSet,
                    PhoneDetailsViewSet, TechSpecsViewSet, VendorViewSet,
                    api_info_view)

router = DefaultRouter()
router.register(r"tags", AssetTagViewSet, basename="asset-tag")
router.register(r"lifecycles", CustomLifecycleViewSet, basename="custom-lifecycle")
router.register(r"vendors", VendorViewSet, basename="vendor")
router.register(r"tech-specs", TechSpecsViewSet, basename="tech-specs")
router.register(r"categories", AssetCategoryViewSet, basename="asset-category")
router.register(r"attachments", AssetAttachmentViewSet, basename="asset-attachment")
router.register(r"computer-details", ComputerDetailsViewSet, basename="computer-details")
router.register(r"network-details", NetworkDetailsViewSet, basename="network-details")
router.register(r"display-details", DisplayDetailsViewSet, basename="display-details")
router.register(r"phone-details", PhoneDetailsViewSet, basename="phone-details")
router.register(r"peripheral-details", PeripheralDetailsViewSet, basename="peripheral-details")

# Add chunks urls
router.register(r"basic-details", AssetBasicDetailsViewSet, basename="asset-basic-details")
router.register(r"tech-specs", AssetTechSpecsViewSet, basename="asset-tech-specs")

router.register(r"relations", AssetRelationDirectViewSet, basename="asset-relation-direct")
router.register(r"", AssetViewSet, basename="asset")

# Nested router for images under assets
assets_router = routers.NestedDefaultRouter(router, r"", lookup="asset")
assets_router.register(r"images", AssetImageViewSet, basename="asset-images")
assets_router.register(r"calendar-alerts", CalendarAlertViewSet, basename="calendar-alerts")
assets_router.register(r"relations", AssetRelationViewSet, basename="asset-relation")

urlpatterns = [
    path("", include(router.urls)),
    path("", include(assets_router.urls)),
    path("", api_info_view, name="assets_api_info"),
]
