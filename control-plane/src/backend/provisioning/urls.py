"""
URL configuration for provisioning app.
"""

from django.urls import path
from . import views

app_name = "provisioning"

urlpatterns = [
    path(
        "tenants/<uuid:company_id>/provision/",
        views.trigger_provisioning,
        name="trigger-provisioning",
    ),
    path(
        "tenants/<uuid:company_id>/status/",
        views.get_provisioning_status,
        name="get-provisioning-status",
    ),
    path(
        "tenants/",
        views.list_provisioning_statuses,
        name="list-provisioning-statuses",
    ),
]
