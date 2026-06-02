from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ActionConditionViewSet,
    ActionOperationViewSet,
    ActionViewSet,
    EventViewSet,
    HostGroupViewSet,
    HostTagViewSet,
    HostViewSet,
    ItemViewSet,
    MaintenanceWindowViewSet,
    MediaTypeViewSet,
    MonitoringStatsView,
    ProblemViewSet,
    ProxyViewSet,
    TemplateTagViewSet,
    TemplateViewSet,
    TriggerViewSet,
)

router = DefaultRouter()
router.register(r"host-groups", HostGroupViewSet, basename="monitoring-host-group")
router.register(r"hosts", HostViewSet, basename="monitoring-host")
router.register(r"host-tags", HostTagViewSet, basename="monitoring-host-tag")
router.register(r"proxies", ProxyViewSet, basename="monitoring-proxy")
router.register(r"templates", TemplateViewSet, basename="monitoring-template")
router.register(r"template-tags", TemplateTagViewSet, basename="monitoring-template-tag")
router.register(r"items", ItemViewSet, basename="monitoring-item")
router.register(r"triggers", TriggerViewSet, basename="monitoring-trigger")
router.register(r"problems", ProblemViewSet, basename="monitoring-problem")
router.register(r"events", EventViewSet, basename="monitoring-event")
router.register(r"maintenance-windows", MaintenanceWindowViewSet, basename="monitoring-maintenance-window")
router.register(r"actions", ActionViewSet, basename="monitoring-action")
router.register(r"action-conditions", ActionConditionViewSet, basename="monitoring-action-condition")
router.register(r"action-operations", ActionOperationViewSet, basename="monitoring-action-operation")
router.register(r"media-types", MediaTypeViewSet, basename="monitoring-media-type")

urlpatterns = [
    path("stats/", MonitoringStatsView.as_view(), name="monitoring-stats"),
    path("", include(router.urls)),
]
