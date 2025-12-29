from rest_framework import viewsets
from .models import Provider, DataCircuit
from .serializers import ProviderSerializer, DataCircuitSerializer


class ProviderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing providers.
    """

    queryset = Provider.objects.all()
    serializer_class = ProviderSerializer


class DataCircuitViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing data circuits.
    """

    queryset = DataCircuit.objects.select_related("provider", "location").all()
    serializer_class = DataCircuitSerializer

