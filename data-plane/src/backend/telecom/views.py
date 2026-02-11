from rest_framework import viewsets

from .models import DataCircuit, PhoneNumber, Provider, Service
from .serializers import (
    DataCircuitSerializer,
    PhoneNumberSerializer,
    ProviderSerializer,
    ServiceSerializer,
)


class ProviderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing providers.
    """

    queryset = Provider.objects.all()
    serializer_class = ProviderSerializer


class ServiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing services (business-facing; distinct from data circuits).
    """

    queryset = Service.objects.select_related("provider", "location").all()
    serializer_class = ServiceSerializer


class DataCircuitViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing data circuits.
    """

    queryset = DataCircuit.objects.select_related("provider", "location", "service").all()
    serializer_class = DataCircuitSerializer


class PhoneNumberViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing phone numbers (Telecom Expense Management).
    """

    queryset = PhoneNumber.objects.select_related(
        "provider", "service", "location"
    ).all()
    serializer_class = PhoneNumberSerializer
    search_fields = ["number", "friendly_name"]
    ordering_fields = ["number", "friendly_name"]
