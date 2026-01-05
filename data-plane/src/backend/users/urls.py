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
    # Groups and Permissions
    path("", include(router.urls)),
]
