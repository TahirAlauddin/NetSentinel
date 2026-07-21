from __future__ import annotations

import logging

from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import AgentStep, Incident, RemediationAction, RemediationScriptPolicy
from .permissions import CanExecuteRemediation
from .serializers import (
    AgentStepSerializer,
    IncidentDetailSerializer,
    IncidentListSerializer,
    RemediationActionSerializer,
    RemediationScriptPolicySerializer,
)
from .services.agent_loop import (
    ApprovalError,
    InterventionError,
    approve_and_execute,
    intervene as intervene_incident,
)

logger = logging.getLogger(__name__)


class IncidentViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = Incident.objects.select_related("resolved_asset", "resolved_device").all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ("retrieve", "intervene"):
            return IncidentDetailSerializer
        return IncidentListSerializer

    @action(detail=True, methods=["post"], permission_classes=[CanExecuteRemediation])
    def intervene(self, request, pk=None):
        """Human takeover: stop the agent working this incident and hand it to
        the requesting user. Gated by the same permission as approving a
        remediation action — same trust boundary, someone who can execute a fix
        can also decide to handle one themselves."""
        incident = self.get_object()
        try:
            intervene_incident(incident, request.user, request.data.get("note", ""))
        except InterventionError as exc:
            return Response({"detail": exc.detail}, status=status.HTTP_409_CONFLICT)

        serializer = self.get_serializer(incident)
        return Response(serializer.data)


class AgentStepViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    queryset = AgentStep.objects.select_related("incident").all()
    serializer_class = AgentStepSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        incident_id = self.request.query_params.get("incident")
        if incident_id:
            qs = qs.filter(incident_id=incident_id)
        return qs


class RemediationActionViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    queryset = RemediationAction.objects.select_related("incident", "approved_by").all()
    serializer_class = RemediationActionSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["post"], permission_classes=[CanExecuteRemediation])
    def approve(self, request, pk=None):
        remediation_action = self.get_object()
        try:
            approve_and_execute(remediation_action, request.user)
        except ApprovalError as exc:
            payload = {"detail": exc.detail}
            if exc.violations:
                payload["violations"] = exc.violations
            return Response(payload, status=status.HTTP_409_CONFLICT)

        serializer = self.get_serializer(remediation_action)
        return Response(serializer.data)


class RemediationScriptPolicyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RemediationScriptPolicy.objects.all()
    serializer_class = RemediationScriptPolicySerializer
    permission_classes = [IsAuthenticated]
