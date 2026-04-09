from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response

from .models import (
    CarrierContact,
    Category,
    Circuit,
    CompanyProfile,
    Contact,
    Department,
    Location,
    PointOfContact,
    UtilityContact,
)
from .serializers import (
    CarrierContactSerializer,
    CategorySerializer,
    CircuitSerializer,
    CompanyProfileSerializer,
    ContactSerializer,
    DepartmentSerializer,
    LocationSerializer,
    PointOfContactSerializer,
    UtilityContactSerializer,
)


class LocationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing locations.
    """

    queryset = Location.objects.all()
    serializer_class = LocationSerializer

    @action(detail=True, methods=["get"])
    def circuits(self, request: Request, pk=None) -> Response:
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
    def contacts(self, request: Request, pk=None) -> Response:
        """Get all points of contact for a circuit."""
        circuit = self.get_object()
        contacts = circuit.points_of_contact.all()
        serializer = PointOfContactSerializer(contacts, many=True)
        return Response(serializer.data)


class PointOfContactViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing points of contact.
    """

    queryset = PointOfContact.objects.select_related("circuit", "circuit__location").all()
    serializer_class = PointOfContactSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing departments.
    """

    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing categories.
    """

    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class ContactViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing contacts.
    """

    queryset = Contact.objects.all()
    serializer_class = ContactSerializer


class CarrierContactViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing carrier contacts.
    """

    queryset = CarrierContact.objects.select_related("location").all()
    serializer_class = CarrierContactSerializer


class UtilityContactViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing utility contacts.
    """

    queryset = UtilityContact.objects.select_related("location").all()
    serializer_class = UtilityContactSerializer


class CompanyProfileViewSet(viewsets.ModelViewSet):
    """
    CRUD for company profile settings.
    """

    queryset = CompanyProfile.objects.all().order_by("id")
    serializer_class = CompanyProfileSerializer
