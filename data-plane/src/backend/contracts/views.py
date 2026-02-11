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

from .models import Contract, ContractCategory
from .serializers import ContractSerializer
from .services import get_contract_overview


class ContractViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing contracts.

    Supports list, create, retrieve, update, partial_update, destroy.
    List supports ?search= (carrier, contract_number) and ?ordering=.
    Queryset is ordered by carrier then contract_number.
    """

    queryset = Contract.objects.select_related("category")
    serializer_class = ContractSerializer
    search_fields = ("carrier", "contract_number")
    ordering_fields = ("carrier", "contract_number", "start_date", "end_date")

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

    @action(detail=True, methods=["get"], url_path="logo")
    def logo(self, request, pk=None):
        """
        Stream the contract logo image. Requires authentication.
        """
        contract = self.get_object()
        if not contract.logo:
            raise Http404("No logo attached to this contract.")
        path = contract.logo.path
        if not path or not os.path.isfile(path):
            raise Http404("Logo file not found.")
        ext = os.path.splitext(contract.logo.name)[1].lower()
        content_types = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".webp": "image/webp",
        }
        content_type = content_types.get(ext, "image/png")
        with open(path, "rb") as f:
            content = f.read()
        return HttpResponse(content, content_type=content_type)

    @action(detail=False, methods=["get"], url_path="overview")
    def overview(self, request):
        """
        Return overview stats and chart data: at_glance, spending_by_category,
        top_contracts, categories, total_spend.
        """
        data = get_contract_overview()
        return Response(data)

    @action(detail=False, methods=["get"], url_path="categories")
    def categories_list(self, request):
        """List contract categories (id, name) for dropdowns."""
        cats = ContractCategory.objects.order_by("name").values("id", "name")
        return Response(list(cats))
