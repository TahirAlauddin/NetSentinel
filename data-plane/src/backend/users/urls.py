from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = "users"

router = DefaultRouter()
router.register(r"groups", views.GroupViewSet, basename="group")
router.register(r"permissions", views.PermissionViewSet, basename="permission")

urlpatterns = [
    # Public endpoints
    path("", views.api_info_view, name="users_api_info"),
    # Admin endpoints
    path("stats/", views.user_stats_view, name="user_stats"),
    # RBAC: current user's permission codenames (for frontend)
    path("current-permissions/", views.current_user_permissions_view, name="current_permissions"),
    # App-level group create/update endpoints used by the settings UI.
    path(
        "groups/app-level/",
        views.create_group_from_permission_bundles_view,
        name="groups-app-level-create",
    ),
    path(
        "groups/<int:group_id>/app-level/",
        views.update_group_from_permission_bundles_view,
        name="groups-app-level-update",
    ),
    # Groups and Permissions
    path("", include(router.urls)),
    # User admin: assignments (groups + direct permissions)
    path("<int:user_id>/assignments/", views.user_assignments_view, name="user-assignments"),
]
