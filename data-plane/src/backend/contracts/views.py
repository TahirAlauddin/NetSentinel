"""
ViewSets for the contracts app.

Provides CRUD over Contract via ModelViewSet with default
DRF pagination, search, and ordering from core settings.
"""

import os
from datetime import date, timedelta
from decimal import Decimal

from django.db.models import Count, Q, Sum
from django.http import Http404, HttpResponse
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Contract, ContractCategory
from .serializers import ContractSerializer


class ContractViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing contracts.

    Supports list, create, retrieve, update, partial_update, destroy.
    List supports ?search= (carrier, contract_number) and ?ordering=.
    Queryset is ordered by carrier then contract_number.
    """

    queryset = Contract.objects.all()
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
        today = date.today()
        d30 = today + timedelta(days=30)
        d60 = today + timedelta(days=60)
        d90 = today + timedelta(days=90)

        qs = Contract.objects.all()
        total = qs.count()

        # Active: end_date is null or end_date >= today
        active_qs = qs.filter(Q(end_date__isnull=True) | Q(end_date__gte=today))
        active = active_qs.count()
        expired = qs.filter(end_date__isnull=False, end_date__lt=today).count()

        expiring_30 = active_qs.filter(
            end_date__isnull=False, end_date__gte=today, end_date__lte=d30
        ).count()
        expiring_60 = active_qs.filter(
            end_date__isnull=False, end_date__gt=d30, end_date__lte=d60
        ).count()
        expiring_90 = active_qs.filter(
            end_date__isnull=False, end_date__gt=d60, end_date__lte=d90
        ).count()

        at_glance = {
            "total": total,
            "active": active,
            "expired": expired,
            "expiring_30": expiring_30,
            "expiring_60": expiring_60,
            "expiring_90": expiring_90,
            "monthly": 0,
        }

        # Spending by category (sum of MRC per category; annualized for display)
        spending_qs = (
            qs.values("category__name")
            .annotate(mrc_sum=Sum("mrc"))
            .filter(mrc_sum__gt=0)
            .order_by("-mrc_sum")
        )
        colors = [
            "#10b981",
            "#3b82f6",
            "#f59e0b",
            "#ec4899",
            "#8b5cf6",
            "#6366f1",
        ]
        spending_by_category = []
        for i, row in enumerate(spending_qs):
            name = row["category__name"] or "Uncategorized"
            mrc_sum = float(row["mrc_sum"] or 0)
            value = round(mrc_sum * 12, 2)  # annualized for chart
            spending_by_category.append(
                {
                    "name": name,
                    "value": value,
                    "color": colors[i % len(colors)],
                }
            )

        # Top 5 active contracts by MRC (annualized value for bar)
        top_contracts_qs = (
            active_qs.order_by("-mrc")[:5]
        )
        top_contracts = []
        for c in top_contracts_qs:
            mrc = float(c.mrc or 0)
            top_contracts.append(
                {
                    "name": f"{c.carrier} – {c.contract_number}"[:30],
                    "value": round(mrc * 12, 0),
                    "color": "#93c5fd" if len(top_contracts) == 0 else "#2563eb",
                }
            )
        # Assign distinct colors for bar chart
        bar_colors = ["#93c5fd", "#2563eb", "#14b8a6", "#5eead4", "#99f6e4"]
        for i, item in enumerate(top_contracts):
            item["color"] = bar_colors[i % len(bar_colors)]

        # All categories with contract count (seeded categories + count per category)
        categories = []
        for cat in ContractCategory.objects.order_by("name"):
            count = qs.filter(category=cat).count()
            if cat.name == "Uncategorized":
                count += qs.filter(category__isnull=True).count()
            categories.append({"name": cat.name, "count": count})

        # Total spend (annualized MRC sum)
        total_mrc = qs.aggregate(s=Sum("mrc"))["s"] or Decimal("0")
        total_spend = float(total_mrc * 12)

        return Response(
            {
                "at_glance": at_glance,
                "spending_by_category": spending_by_category,
                "top_contracts": top_contracts,
                "categories": categories,
                "total_spend": round(total_spend, 2),
            }
        )

    @action(detail=False, methods=["get"], url_path="categories")
    def categories_list(self, request):
        """List contract categories (id, name) for dropdowns."""
        cats = ContractCategory.objects.order_by("name").values("id", "name")
        return Response(list(cats))
