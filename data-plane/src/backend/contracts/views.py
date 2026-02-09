"""
ViewSets for the contracts app.

Provides CRUD over Contract via ModelViewSet with default
DRF pagination, search, and ordering from core settings.
"""

import os

from django.http import Http404, HttpResponse
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

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

    @action(detail=True, methods=["get"], url_path="document")
    def document(self, request, pk=None):
        """
        Stream the contract document file for view/download.
        Requires authentication. Sets Content-Disposition for download.
        """
        contract = self.get_object()
        if not contract.document:
            raise Http404("No document attached to this contract.")
        path = contract.document.path
        if not path or not os.path.isfile(path):
            raise Http404("Document file not found.")
        filename = os.path.basename(contract.document.name)
        with open(path, "rb") as f:
            content = f.read()
        response = HttpResponse(content, content_type="application/octet-stream")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response
