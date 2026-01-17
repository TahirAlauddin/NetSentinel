"""
Device ViewSets for IPAM.
"""

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import Device, DeviceType, Rack
from ..serializers import (
    DeviceCreateUpdateSerializer,
    DeviceSerializer,
    DeviceTypeSerializer,
    RackCreateUpdateSerializer,
    RackSerializer,
)


class DeviceTypeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing device types.

    Provides endpoints for creating, viewing, and managing device types.
    """

    queryset = DeviceType.objects.all()
    serializer_class = DeviceTypeSerializer

    def get_queryset(self):
        """Filter device types by active status."""
        queryset = super().get_queryset()

        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        return queryset


class RackViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing racks.

    Provides endpoints for creating, viewing, and managing racks.
    """

    queryset = Rack.objects.select_related("location").prefetch_related("devices").all()
    serializer_class = RackSerializer

    def get_serializer_class(self):
        """Use create serializer for POST/PUT requests."""
        if self.action in ["create", "update", "partial_update"]:
            return RackCreateUpdateSerializer
        return RackSerializer

    def get_queryset(self):
        """Filter racks by location if provided."""
        queryset = super().get_queryset()

        location_id = self.request.query_params.get("location")
        if location_id:
            queryset = queryset.filter(location_id=location_id)

        return queryset


class DeviceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing devices.

    Provides endpoints for creating, viewing, and managing network devices.
    """

    queryset = Device.objects.select_related("device_type", "location", "rack").all()
    serializer_class = DeviceSerializer

    def get_serializer_class(self):
        """Use create serializer for POST/PUT requests."""
        if self.action in ["create", "update", "partial_update"]:
            return DeviceCreateUpdateSerializer
        return DeviceSerializer

    def get_queryset(self):
        """Filter devices by various criteria."""
        queryset = super().get_queryset()

        # Filter by device type
        device_type = self.request.query_params.get("device_type")
        if device_type:
            queryset = queryset.filter(device_type_id=device_type)

        # Filter by location
        location = self.request.query_params.get("location")
        if location:
            queryset = queryset.filter(location_id=location)

        # Filter by rack
        rack = self.request.query_params.get("rack")
        if rack:
            queryset = queryset.filter(rack_id=rack)

        # Filter by section
        section = self.request.query_params.get("section")
        if section:
            queryset = queryset.filter(sections__contains=[section])

        # Filter by active status
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        return queryset

    @action(detail=False, methods=["get"])
    def statistics(self, request):
        """Get device statistics."""
        total_devices = Device.objects.count()
        active_devices = Device.objects.filter(is_active=True).count()
        devices_by_type = {}

        for device_type in DeviceType.objects.all():
            count = Device.objects.filter(device_type=device_type, is_active=True).count()
            if count > 0:
                devices_by_type[device_type.name] = count

        return Response(
            {
                "total_devices": total_devices,
                "active_devices": active_devices,
                "inactive_devices": total_devices - active_devices,
                "devices_by_type": devices_by_type,
            },
            status=status.HTTP_200_OK,
        )
