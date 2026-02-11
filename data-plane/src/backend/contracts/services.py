"""
Business logic for the contracts app.

Overview is built from smaller pieces: at_glance, spending_by_category,
top_contracts, categories, total_spend. The view calls get_contract_overview()
which delegates to these helpers.
"""

from datetime import date
from decimal import Decimal

from django.db.models import Q, QuerySet, Sum

from .constants import BAR_CHART_COLORS, CATEGORY_CHART_COLORS
from .expiry import get_expiry_boundary_dates
from .models import Contract, ContractCategory


def get_at_glance(
    qs: QuerySet[Contract], active_qs: QuerySet[Contract], today: date
) -> dict[str, int]:
    """Counts for at-a-glance cards: total, active, expired, expiring in 30/60/90 days."""
    d30, d60, d90 = get_expiry_boundary_dates(today)
    return {
        "total": qs.count(),
        "active": active_qs.count(),
        "expired": qs.filter(end_date__isnull=False, end_date__lt=today).count(),
        "expiring_30": active_qs.filter(
            end_date__isnull=False, end_date__gte=today, end_date__lte=d30
        ).count(),
        "expiring_60": active_qs.filter(
            end_date__isnull=False, end_date__gt=d30, end_date__lte=d60
        ).count(),
        "expiring_90": active_qs.filter(
            end_date__isnull=False, end_date__gt=d60, end_date__lte=d90
        ).count(),
        "monthly": 0,
    }


def get_spending_by_category(qs: QuerySet[Contract]) -> list[dict[str, str | float]]:
    """MRC summed by category, annualized, with chart colors."""
    spending_qs = (
        qs.values("category__name")
        .annotate(mrc_sum=Sum("mrc"))
        .filter(mrc_sum__gt=0)
        .order_by("-mrc_sum")
    )
    result = []
    for i, row in enumerate(spending_qs):
        name = row["category__name"] or "Uncategorized"
        mrc_sum = float(row["mrc_sum"] or 0)
        result.append(
            {
                "name": name,
                "value": round(mrc_sum * 12, 2),
                "color": CATEGORY_CHART_COLORS[i % len(CATEGORY_CHART_COLORS)],
            }
        )
    return result


def get_top_contracts(active_qs: QuerySet[Contract]) -> list[dict[str, str | float]]:
    """Top 5 active contracts by MRC, annualized value for bar chart."""
    top_qs = active_qs.order_by("-mrc")[:5]
    result = []
    for i, c in enumerate(top_qs):
        mrc = float(c.mrc or 0)
        result.append(
            {
                "name": f"{c.carrier} – {c.contract_number}"[:30],
                "value": round(mrc * 12, 0),
                "color": BAR_CHART_COLORS[i % len(BAR_CHART_COLORS)],
            }
        )
    return result


def get_overview_categories(qs: QuerySet[Contract]) -> list[dict[str, str | int]]:
    """Category names with contract counts (including Uncategorized for null category)."""
    result = []
    for cat in ContractCategory.objects.order_by("name"):
        count = qs.filter(category=cat).count()
        if cat.name == "Uncategorized":
            count += qs.filter(category__isnull=True).count()
        result.append({"name": cat.name, "count": count})
    return result


def get_total_spend(qs: QuerySet[Contract]) -> float:
    """Total annualized spend (sum of MRC * 12)."""
    total_mrc = qs.aggregate(s=Sum("mrc"))["s"] or Decimal("0")
    return round(float(total_mrc * 12), 2)


def get_contract_overview() -> dict:
    """
    Build full overview payload for the overview API action.
    Composes at_glance, spending_by_category, top_contracts, categories, total_spend.
    """
    today = date.today()
    qs = Contract.objects.all()
    active_qs = qs.filter(Q(end_date__isnull=True) | Q(end_date__gte=today))
    return {
        "at_glance": get_at_glance(qs, active_qs, today),
        "spending_by_category": get_spending_by_category(qs),
        "top_contracts": get_top_contracts(active_qs),
        "categories": get_overview_categories(qs),
        "total_spend": get_total_spend(qs),
    }
