from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Location, Circuit, PointOfContact
from .serializers import (
    LocationSerializer,
    CircuitSerializer,
    PointOfContactSerializer,

)


class LocationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing locations.
    """

    queryset = Location.objects.all()
    serializer_class = LocationSerializer

    @action(detail=True, methods=["get"])
    def circuits(self, request, pk=None):
        """Get all circuits for a location."""
        location = self.get_object()
        circuits = location.circuits.all()
        serializer = CircuitSerializer(circuits, many=True)
        return Response(serializer.data)


class CircuitViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing circuits.
    """

    queryset = Circuit.objects.select_related("location").all()
    serializer_class = CircuitSerializer

    @action(detail=True, methods=["get"])
    def contacts(self, request, pk=None):
        """Get all points of contact for a circuit."""
        circuit = self.get_object()
        contacts = circuit.points_of_contact.all()
        serializer = PointOfContactSerializer(contacts, many=True)
        return Response(serializer.data)


class PointOfContactViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing points of contact.
    """

    queryset = PointOfContact.objects.select_related(
        "circuit", "circuit__location"
    ).all()
    serializer_class = PointOfContactSerializer

