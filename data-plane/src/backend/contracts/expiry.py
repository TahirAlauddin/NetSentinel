"""
Single source of truth for contract expiry status and labels.

Used by: overview at_glance counts (via boundary dates) and serializer (per-contract label).
No duplicate date logic; change bucket boundaries in constants only.
"""

from datetime import date, timedelta

from .constants import EXPIRY_DAYS_30, EXPIRY_DAYS_60, EXPIRY_DAYS_90


def get_expiry_boundary_dates(today: date | None = None) -> tuple[date, date, date]:
    """Return d30, d60, d90 used for expiry buckets (shared by overview and per-contract)."""
    today = today or date.today()
    return (
        today + timedelta(days=EXPIRY_DAYS_30),
        today + timedelta(days=EXPIRY_DAYS_60),
        today + timedelta(days=EXPIRY_DAYS_90),
    )


def get_contract_expiry_status(
    end_date: date | None, today: date | None = None
) -> dict[str, str] | None:
    """
    Return expiry status and display label for a contract, or None if no label (active / no end).
    Buckets match overview at_glance: expired, expiring_30, expiring_60, expiring_90.
    """
    if end_date is None:
        return None
    today = today or date.today()
    d30, d60, d90 = get_expiry_boundary_dates(today)
    if end_date < today:
        return {"status": "expired", "label": "Expired"}
    if end_date <= d30:
        return {"status": "expiring_30", "label": "Expiring in 0–30 days"}
    if end_date <= d60:
        return {"status": "expiring_60", "label": "Expiring in 30–60 days"}
    if end_date <= d90:
        return {"status": "expiring_90", "label": "Expiring in 60–90 days"}
    return None
