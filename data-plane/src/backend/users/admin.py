from django.contrib import admin
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group

from .models import ExtendedGroup, PermissionBundle, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom User admin configuration for managing users in Django admin.
    """

    list_display = (
        "email",
        "first_name",
        "last_name",
        "department",
        "position",
        "is_active",
        "is_staff",
        "created_at",
    )
    list_filter = ("is_active", "is_staff", "is_superuser", "department", "created_at")
    search_fields = ("email", "first_name", "last_name", "department", "position")
    ordering = ("-created_at",)

    fieldsets = (
        (None, {"fields": ("email", "username", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name", "phone_number")}),
        ("Work info", {"fields": ("department", "position")}),
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
                    "department",
                    "position",
                ),
            },
        ),
    )

    readonly_fields = ("created_at", "updated_at", "date_joined", "last_login")

    def get_queryset(self, request):
        return super().get_queryset(request).select_related()


# Unregister default Group so we can add ExtendedGroup (bundles) inline
admin.site.unregister(Group)


class ExtendedGroupInline(admin.StackedInline):
    model = ExtendedGroup
    filter_horizontal = ("bundles",)
    can_delete = True
    max_num = 1
    verbose_name = "Permission bundles (Layer 2)"
    verbose_name_plural = "Permission bundles (Layer 2)"


@admin.register(Group)
class ExtendedGroupAdmin(BaseGroupAdmin):
    """Group admin: manage group name/permissions; assign bundles via inline."""

    inlines = (ExtendedGroupInline,)
    filter_horizontal = ("permissions",)


@admin.register(PermissionBundle)
class PermissionBundleAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "app", "permission_count")
    list_filter = ("app",)
    search_fields = ("name", "code")
    filter_horizontal = ("permissions",)
    ordering = ("app", "code")

    def permission_count(self, obj):
        return obj.permissions.count()

    permission_count.short_description = "Permissions"
