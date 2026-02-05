"""
ViewSets for the contracts app.

Provides CRUD over Contract via ModelViewSet with default
DRF pagination, search, and ordering from core settings.
"""

from rest_framework import viewsets

from .models import Contract
from .serializers import ContractSerializer


class ContractViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing contracts.

    Supports list, create, retrieve, update, partial_update, destroy.
    Queryset is ordered by carrier then contract_number.
    """

    queryset = Contract.objects.all()
    serializer_class = ContractSerializer
