"""
Constants for the contracts app (charts, expiry buckets, etc.).
"""

# Expiry bucket boundaries (days from today); used by overview counts and per-contract label
EXPIRY_DAYS_30 = 30
EXPIRY_DAYS_60 = 60
EXPIRY_DAYS_90 = 90

# Chart colors for overview spending-by-category pie and top-contracts bar
CATEGORY_CHART_COLORS = [
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#ec4899",
    "#8b5cf6",
    "#6366f1",
]

BAR_CHART_COLORS = [
    "#93c5fd",
    "#2563eb",
    "#14b8a6",
    "#5eead4",
    "#99f6e4",
]
