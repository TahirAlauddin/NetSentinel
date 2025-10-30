"""
API views for tenant provisioning.
"""

import logging
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from users.models import Company
from .models import TenantProvisioning
from .serializers import (
    TenantProvisioningSerializer,
    ProvisionTriggerSerializer,
)
from .tasks import provision_tenant

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def trigger_provisioning(request, company_id):
    """
    Manually trigger provisioning for a tenant.

    POST /api/v1/provisioning/tenants/{company_id}/provision/
    """
    company = get_object_or_404(Company, id=company_id)

    # Check permissions - only staff or company admin can trigger
    if not request.user.is_staff and (
        not hasattr(request.user, "company")
        or request.user.company_id != company.id
        or not request.user.is_company_admin
    ):
        return Response(
            {"error": "Permission denied."},
            status=status.HTTP_403_FORBIDDEN,
        )

    serializer = ProvisionTriggerSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    force = serializer.validated_data.get("force", False)

    # Trigger the provisioning task
    task = provision_tenant.delay(str(company.id), force=force)

    return Response(
        {
            "message": "Provisioning task queued",
            "task_id": task.id,
            "company_id": str(company.id),
            "company_name": company.name,
            "force": force,
        },
        status=status.HTTP_202_ACCEPTED,
    )


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def get_provisioning_status(request, company_id):
    """
    Get provisioning status for a tenant.

    GET /api/v1/provisioning/tenants/{company_id}/status/
    """
    company = get_object_or_404(Company, id=company_id)

    # Check permissions
    if not request.user.is_staff and (
        not hasattr(request.user, "company") or request.user.company_id != company.id
    ):
        return Response(
            {"error": "Permission denied."},
            status=status.HTTP_403_FORBIDDEN,
        )

    provisioning, created = TenantProvisioning.objects.get_or_create(
        company=company,
        defaults={
            "namespace_name": f"tenant-{str(company.id)[:8]}",
            "status": "pending",
        },
    )

    serializer = TenantProvisioningSerializer(provisioning)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([permissions.IsAdminUser])
def list_provisioning_statuses(request):
    """
    List all tenant provisioning statuses (admin only).

    GET /api/v1/provisioning/tenants/
    """
    provisionings = TenantProvisioning.objects.select_related("company").all()
    serializer = TenantProvisioningSerializer(provisionings, many=True)
    return Response(serializer.data)
