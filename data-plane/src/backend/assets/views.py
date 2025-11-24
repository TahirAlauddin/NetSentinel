from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import *
from .serializers import *


class AssetTagViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing asset tags.
    """

    queryset = AssetTag.objects.all()
    serializer_class = AssetTagSerializer
    permission_classes = [IsAuthenticated]


class CustomLifecycleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing custom lifecycles.
    """

    queryset = CustomLifecycle.objects.all()
    serializer_class = CustomLifecycleSerializer
    permission_classes = [IsAuthenticated]


class VendorViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing vendors.
    """

    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = [IsAuthenticated]


class TechSpecsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing tech specs.
    """

    queryset = TechSpecs.objects.all()
    serializer_class = TechSpecsSerializer
    permission_classes = [IsAuthenticated]


class AssetCategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing asset categories.
    """

    queryset = AssetCategory.objects.select_related("tech_specs").all()
    serializer_class = AssetCategorySerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["get"])
    def assets(self, request, pk=None):
        """Get all assets for a category."""
        category = self.get_object()
        assets = category.assets.all()
        serializer = AssetSerializer(assets, many=True)
        return Response(serializer.data)


class AssetViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing assets with polymorphic extension details.
    """

    queryset = (
        Asset.objects.select_related(
            "category",
            "vendor",
            "assigned_to",
            "location",
            "used_by",
            "managed_by",
            "custom_lifecycle",
        )
        .prefetch_related(
            "tags",
            "departments",
            "computer_details",
            "network_details",
            "display_details",
            "phone_details",
            "peripheral_details",
        )
        .all()
    )
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        """Use different serializers for read vs write operations."""
        if self.action in ["create", "update", "partial_update"]:
            return AssetCreateUpdateSerializer
        return AssetSerializer

    def get_queryset(self):
        """Filter queryset based on query parameters."""
        queryset = super().get_queryset()

        # Filter by category
        category = self.request.query_params.get("category", None)
        if category:
            queryset = queryset.filter(category_id=category)

        # Filter by status
        status_filter = self.request.query_params.get("status", None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by vendor
        vendor = self.request.query_params.get("vendor", None)
        if vendor:
            queryset = queryset.filter(vendor_id=vendor)

        # Filter by location
        location = self.request.query_params.get("location", None)
        if location:
            queryset = queryset.filter(location_id=location)

        # Search by name or asset_tag
        search = self.request.query_params.get("search", None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(asset_tag__icontains=search)
            )

        return queryset

    @action(detail=True, methods=["get"])
    def attachments(self, request, pk=None):
        """Get all attachments for an asset."""
        asset = self.get_object()
        attachments = asset.get_attachments()
        serializer = AssetAttachmentSerializer(attachments, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def related_assets(self, request, pk=None):
        """Get all related assets (both directions)."""
        asset = self.get_object()
        # Get relations where this asset is the source
        outgoing_relations = AssetRelation.objects.filter(asset=asset).select_related(
            "related_asset"
        )
        # Get relations where this asset is the target
        incoming_relations = AssetRelation.objects.filter(
            related_asset=asset
        ).select_related("asset")

        # Combine both directions
        all_relations = list(outgoing_relations) + list(incoming_relations)
        serializer = AssetRelationSerializer(all_relations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def add_related_asset(self, request, pk=None):
        """Add a related asset."""
        asset = self.get_object()
        related_asset_id = request.data.get("related_asset_id")

        if not related_asset_id:
            return Response(
                {"error": "related_asset_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            related_asset = Asset.objects.get(id=related_asset_id)
        except Asset.DoesNotExist:
            return Response(
                {"error": "Related asset not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        relation, created = AssetRelation.objects.get_or_create(
            asset=asset,
            related_asset=related_asset,
        )

        if created:
            serializer = AssetRelationSerializer(relation)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(
                {"error": "Relation already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=["delete"])
    def remove_related_asset(self, request, pk=None):
        """Remove a related asset."""
        asset = self.get_object()
        related_asset_id = request.query_params.get("related_asset_id")

        if not related_asset_id:
            return Response(
                {"error": "related_asset_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            relation = AssetRelation.objects.get(
                asset=asset,
                related_asset_id=related_asset_id,
            )
            relation.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except AssetRelation.DoesNotExist:
            return Response(
                {"error": "Relation not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Get asset statistics."""
        total_assets = Asset.objects.count()
        active_assets = Asset.objects.filter(status="active").count()
        retired_assets = Asset.objects.filter(status="retired").count()
        in_repair_assets = Asset.objects.filter(status="in_repair").count()
        disposed_assets = Asset.objects.filter(status="disposed").count()

        stats = {
            "total": total_assets,
            "active": active_assets,
            "retired": retired_assets,
            "in_repair": in_repair_assets,
            "disposed": disposed_assets,
        }

        return Response(stats)


class AssetAttachmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing asset attachments.
    """

    queryset = AssetAttachment.objects.select_related("uploaded_by").all()
    serializer_class = AssetAttachmentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """Set the uploaded_by field to the current user."""
        serializer.save(uploaded_by=self.request.user)


class AssetRelationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing asset relations.
    """

    queryset = AssetRelation.objects.select_related("asset", "related_asset").all()
    serializer_class = AssetRelationSerializer
    permission_classes = [IsAuthenticated]


# Extension detail viewsets (read-only for now, can be extended if needed)
class ComputerDetailsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing computer details.
    """

    queryset = ComputerDetails.objects.select_related("asset").all()
    serializer_class = ComputerDetailsSerializer
    permission_classes = [IsAuthenticated]


class NetworkDetailsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing network details.
    """

    queryset = NetworkDetails.objects.select_related("asset").all()
    serializer_class = NetworkDetailsSerializer
    permission_classes = [IsAuthenticated]


class DisplayDetailsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing display details.
    """

    queryset = DisplayDetails.objects.select_related("asset").all()
    serializer_class = DisplayDetailsSerializer
    permission_classes = [IsAuthenticated]


class PhoneDetailsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing phone details.
    """

    queryset = PhoneDetails.objects.select_related("asset").all()
    serializer_class = PhoneDetailsSerializer
    permission_classes = [IsAuthenticated]


class PeripheralDetailsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing peripheral details.
    """

    queryset = PeripheralDetails.objects.select_related("asset").all()
    serializer_class = PeripheralDetailsSerializer
    permission_classes = [IsAuthenticated]


# ---------------------
# Assets Chunks
# ---------------------


class AssetBasicDetailsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing asset basic details.
    """

    queryset = (
        Asset.objects.select_related("category", "vendor")
        .prefetch_related("tags")
        .all()
    )
    serializer_class = AssetBasicDetailsSerializer
    permission_classes = [IsAuthenticated]


class AssetTechSpecsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing asset tech specs.
    """

    queryset = (
        Asset.objects.values(
            "id", "name", "mac_address", "ip_address", "manufacturer", "model"
        )
        .prefetch_related("tags")
        .all()
    )
    serializer_class = AssetTechSpecsSerializer
    permission_classes = [IsAuthenticated]


class AssetImageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing asset images nested under assets.
    """

    serializer_class = AssetImageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filter images by the asset ID from the nested route.
        """
        asset_id = self.kwargs.get("asset_pk")
        queryset = AssetImage.objects.select_related("asset").filter(asset_id=asset_id)
        return queryset

    def perform_create(self, serializer):
        """
        Set the asset when creating a new image.
        """
        asset_id = self.kwargs.get("asset_pk")
        serializer.save(asset_id=asset_id)

class CalendarAlertViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing calendar alerts.
    """

    serializer_class = CalendarAlertSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        """
        Use different serializers for read vs write operations.
        """
        if self.action in ["create", "update", "partial_update"]:
            return CalendarAlertCreateUpdateSerializer
        return CalendarAlertSerializer

    def get_queryset(self):
        """
        Filter alerts by the asset ID from the nested route.
        """
        asset_id = self.kwargs.get("asset_pk")
        queryset = CalendarAlert.objects.select_related("asset", "assigned_to").filter(asset_id=asset_id)
        return queryset

    def perform_create(self, serializer):
        """
        Set the asset when creating a new alert.
        """
        asset_id = self.kwargs.get("asset_pk")
        serializer.save(asset_id=asset_id)  
