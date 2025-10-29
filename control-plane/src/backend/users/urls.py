from django.urls import path, include
from . import views
from rest_framework import routers

router = routers.DefaultRouter()
router.register(r"companies", views.CompanyViewSet, basename="company")

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
urlpatterns += router.urls