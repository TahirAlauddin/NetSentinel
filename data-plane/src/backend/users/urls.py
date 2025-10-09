from django.urls import path, include
from . import views

app_name = "users"

urlpatterns = [
    # Public endpoints
    path("", views.api_info_view, name="api_info"),
    # Admin endpoints
    path("stats/", views.user_stats_view, name="user_stats"),
    # Djoser endpoints for authentication and user management
    path("auth/", include("djoser.urls")),
    path("auth/", include("djoser.urls.jwt")),
]
