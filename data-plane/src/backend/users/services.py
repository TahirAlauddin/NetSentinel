from typing import Dict

from .models import User


def get_user_stats() -> Dict[str, int]:
    """
    Return aggregate statistics about users in the system.
    """
    return {
        "total_users": User.objects.count(),
        "active_users": User.objects.filter(is_active=True).count(),
        "staff_users": User.objects.filter(is_staff=True).count(),
        "superusers": User.objects.filter(is_superuser=True).count(),
    }

