from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Company


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    """
    Admin configuration for Company model.
    """

    list_display = ("name", "size", "is_active", "created_at", "user_count")
    list_filter = ("is_active", "size", "created_at")
    search_fields = ("name",)
    ordering = ("-created_at",)
    readonly_fields = ("id", "created_at", "updated_at")

    fieldsets = (
        (None, {"fields": ("id", "name", "size", "is_active")}),
        ("Important dates", {"fields": ("created_at", "updated_at")}),
    )

    def user_count(self, obj):
        """Display the number of users in this company."""
        return obj.users.count()

    user_count.short_description = "Users"


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom User admin configuration for managing users in Django admin.
    """

    list_display = (
        "email",
        "first_name",
        "last_name",
        "company",
        "is_company_admin",
        "department",
        "position",
        "is_active",
        "is_staff",
        "created_at",
    )
    list_filter = (
        "is_active",
        "is_staff",
        "is_superuser",
        "is_company_admin",
        "company",
        "department",
        "created_at",
    )
    search_fields = (
        "email",
        "first_name",
        "last_name",
        "company__name",
        "department",
        "position",
    )
    ordering = ("-created_at",)

    fieldsets = (
        (None, {"fields": ("email", "username", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name", "phone_number")}),
        (
            "Work info",
            {"fields": ("department", "position", "company", "is_company_admin")},
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        (
            "Important dates",
            {"fields": ("last_login", "date_joined", "created_at", "updated_at")},
        ),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "username",
                    "first_name",
                    "last_name",
                    "password1",
                    "password2",
                    "company",
                    "department",
                    "position",
                ),
            },
        ),
    )

    readonly_fields = ("created_at", "updated_at", "date_joined", "last_login")

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("company")
