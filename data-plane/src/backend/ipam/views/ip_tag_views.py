"""
IP Tag ViewSets for IPAM.
"""

from django.db import models
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import IPTag, IPAddressTag, IPAddress
from ..serializers import (
    IPTagSerializer,
    IPTagCreateUpdateSerializer,
    IPAddressTagSerializer,
    IPAddressTagCreateSerializer,
)


class IPTagViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing IP tags.
    
    Provides CRUD operations for IP tags.
    """

    queryset = IPTag.objects.all()
    serializer_class = IPTagSerializer

    def get_serializer_class(self):
        """Use create/update serializer for POST/PUT/PATCH requests."""
        if self.action in ["create", "update", "partial_update"]:
            return IPTagCreateUpdateSerializer
        return IPTagSerializer

    def get_queryset(self):
        """Filter by active status if provided."""
        queryset = super().get_queryset()
        
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")
        
        # Order by usage count (most used first) or name
        order_by = self.request.query_params.get("order_by", "name")
        if order_by == "usage":
            queryset = queryset.annotate(
                usage_count=models.Count("ip_addresses")
            ).order_by("-usage_count", "name")
        else:
            queryset = queryset.order_by("name")
        
        return queryset

    @action(detail=True, methods=["get"])
    def usage(self, request, pk=None):
        """Get IP addresses using this tag."""
        tag = self.get_object()
        ip_addresses = IPAddress.objects.filter(tags=tag)
        
        from ..serializers import IPAddressSerializer
        serializer = IPAddressSerializer(ip_addresses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class IPAddressTagViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing IP address tag relationships.
    
    Provides CRUD operations for applying/removing tags from IP addresses.
    """

    queryset = IPAddressTag.objects.select_related(
        "ip_address", "tag", "applied_by"
    ).all()
    serializer_class = IPAddressTagSerializer

    def get_serializer_class(self):
        """Use create serializer for POST requests."""
        if self.action == "create":
            return IPAddressTagCreateSerializer
        return IPAddressTagSerializer

    def get_queryset(self):
        """Filter by IP address or tag if provided."""
        queryset = super().get_queryset()
        
        ip_address_id = self.request.query_params.get("ip_address")
        if ip_address_id:
            queryset = queryset.filter(ip_address_id=ip_address_id)
        
        tag_id = self.request.query_params.get("tag")
        if tag_id:
            queryset = queryset.filter(tag_id=tag_id)
        
        return queryset.order_by("-applied_at")

    def perform_create(self, serializer):
        """Set the user who applied the tag."""
        serializer.save(applied_by=self.request.user)

    @action(detail=False, methods=["post"], url_path="bulk-apply")
    def bulk_apply(self, request):
        """
        Apply tags to multiple IP addresses.
        
        POST /api/v1/ipam/ip-address-tags/bulk-apply/
        Body:
            {
                "ip_address_ids": [1, 2, 3],
                "tag_ids": [1, 2],
                "notes": "Optional notes"
            }
        """
        ip_address_ids = request.data.get("ip_address_ids", [])
        tag_ids = request.data.get("tag_ids", [])
        notes = request.data.get("notes", "")

        if not ip_address_ids or not tag_ids:
            return Response(
                {"error": "ip_address_ids and tag_ids are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created = []
        errors = []

        for ip_id in ip_address_ids:
            for tag_id in tag_ids:
                try:
                    ip_address = IPAddress.objects.get(id=ip_id)
                    tag = IPTag.objects.get(id=tag_id)
                    
                    # Check if already exists
                    if IPAddressTag.objects.filter(
                        ip_address=ip_address, tag=tag
                    ).exists():
                        errors.append(
                            f"Tag '{tag.name}' already applied to {ip_address.address}"
                        )
                        continue
                    
                    ip_address_tag = IPAddressTag.objects.create(
                        ip_address=ip_address,
                        tag=tag,
                        applied_by=request.user,
                        notes=notes,
                    )
                    created.append(ip_address_tag.id)
                except IPAddress.DoesNotExist:
                    errors.append(f"IP address {ip_id} not found")
                except IPTag.DoesNotExist:
                    errors.append(f"Tag {tag_id} not found")
                except Exception as e:
                    errors.append(f"Error applying tag {tag_id} to IP {ip_id}: {str(e)}")

        return Response(
            {
                "created": len(created),
                "created_ids": created,
                "errors": errors,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], url_path="bulk-remove")
    def bulk_remove(self, request):
        """
        Remove tags from multiple IP addresses.
        
        POST /api/v1/ipam/ip-address-tags/bulk-remove/
        Body:
            {
                "ip_address_ids": [1, 2, 3],
                "tag_ids": [1, 2]
            }
        """
        ip_address_ids = request.data.get("ip_address_ids", [])
        tag_ids = request.data.get("tag_ids", [])

        if not ip_address_ids or not tag_ids:
            return Response(
                {"error": "ip_address_ids and tag_ids are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        removed = 0
        errors = []

        for ip_id in ip_address_ids:
            for tag_id in tag_ids:
                try:
                    deleted_count, _ = IPAddressTag.objects.filter(
                        ip_address_id=ip_id, tag_id=tag_id
                    ).delete()
                    removed += deleted_count
                except Exception as e:
                    errors.append(f"Error removing tag {tag_id} from IP {ip_id}: {str(e)}")

        return Response(
            {
                "removed": removed,
                "errors": errors,
            },
            status=status.HTTP_200_OK,
        )
