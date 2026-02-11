"""
URL configuration for netsentinel project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.generic import RedirectView
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions

from .health import health_check
from .views import api_info_view

schema_view = get_schema_view(
    openapi.Info(
        title="NetSentinel API",
        default_version="v1",
        description="NetSentinel User Management API",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="contact@netsentinel.local"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path("", api_info_view, name="core_api_info"),
    path("api/health/", health_check, name="health-check"),
    path("admin/", admin.site.urls),
    # API endpoints
    path("api/v1/users/", include("users.urls")),
    path("api/v1/infrastructure/", include("infrastructure.urls")),
    path("api/v1/assets/", include("assets.urls")),
    path("api/v1/telecom/", include("telecom.urls")),
    path("api/v1/ipam/", include("ipam.urls")),
    path("api/v1/contracts/", include("contracts.urls")),
    # Djoser endpoints for authentication and user management
    path("api/v1/auth/", include("djoser.urls")),
    path("api/v1/auth/", include("djoser.urls.jwt")),
    # API Documentation
    path(
        "swagger/",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    path(
        "redoc/",
        schema_view.with_ui("redoc", cache_timeout=0),
        name="schema-redoc",
    ),
    path(
        "swagger.json",
        schema_view.without_ui(cache_timeout=0),
        name="schema-json",
    ),
    path("api/", RedirectView.as_view(pattern_name="core_api_info", permanent=False)),
]

# Serve uploaded media files in development (DEBUG only)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
