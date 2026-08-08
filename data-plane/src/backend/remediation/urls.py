from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AgentStepViewSet,
    IncidentViewSet,
    RemediationActionViewSet,
    RemediationScriptPolicyViewSet,
)

router = DefaultRouter()
router.register(r"incidents", IncidentViewSet, basename="remediation-incident")
router.register(r"steps", AgentStepViewSet, basename="remediation-step")
router.register(r"actions", RemediationActionViewSet, basename="remediation-action")
router.register(r"policies", RemediationScriptPolicyViewSet, basename="remediation-policy")

urlpatterns = [
    path("", include(router.urls)),
]
