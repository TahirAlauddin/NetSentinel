from django.contrib.auth.models import AbstractUser, Group
from django.db import models
from django.core.exceptions import PermissionDenied


class AppPermission(models.Model):
    """
    Application-level permission model.
    These are app-level permissions (e.g., view_monitoring, create_assets)
    as opposed to Django's model-level permissions (can_add, can_change, can_delete).
    """

    # Permission identifier (e.g., 'view_monitoring', 'create_assets', 'view_assets')
    codename = models.CharField(
        max_length=100,
        unique=True,
        help_text="Unique permission identifier (e.g., 'view_monitoring')",
    )
    name = models.CharField(
        max_length=255,
        help_text="Human-readable permission name (e.g., 'View Monitoring')",
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Detailed description of what this permission allows",
    )
    app_label = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="App/module this permission belongs to (e.g., 'monitoring', 'assets')",
    )
    category = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Permission category for grouping (e.g., 'monitoring', 'assets', 'infrastructure')",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this permission is currently active",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "users_app_permission"
        verbose_name = "App Permission"
        verbose_name_plural = "App Permissions"
        ordering = ["category", "app_label", "codename"]
        indexes = [
            models.Index(fields=["codename"]),
            models.Index(fields=["category", "app_label"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.codename})"


class AppPermissionGroup(models.Model):
    """
    Links Django Groups to App Permissions.
    This allows assigning app-level permissions to groups.
    """

    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name="app_permissions",
        help_text="Django Group",
    )
    permission = models.ForeignKey(
        AppPermission,
        on_delete=models.CASCADE,
        related_name="groups",
        help_text="App Permission",
    )
    granted_at = models.DateTimeField(auto_now_add=True)
    granted_by = models.ForeignKey(
        "User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="granted_group_permissions",
        help_text="User who granted this permission",
    )

    class Meta:
        db_table = "users_app_permission_group"
        verbose_name = "Group App Permission"
        verbose_name_plural = "Group App Permissions"
        unique_together = [["group", "permission"]]
        indexes = [
            models.Index(fields=["group", "permission"]),
        ]

    def __str__(self):
        return f"{self.group.name} - {self.permission.name}"


class User(AbstractUser):
    """
    Custom User model extending AbstractUser.
    This allows for additional fields and customization while maintaining
    all the built-in Django authentication functionality.
    """

    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    position = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True)

    # App-level permissions (many-to-many relationship)
    app_permissions = models.ManyToManyField(
        AppPermission,
        related_name="users",
        blank=True,
        help_text="App-level permissions assigned directly to this user",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "users_user"
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self):
        return self.first_name

    def has_app_permission(self, codename):
        """
        Check if user has a specific app permission.
        Checks both direct permissions and permissions through groups.

        Args:
            codename: Permission codename (e.g., 'view_monitoring', 'create_assets')

        Returns:
            bool: True if user has the permission, False otherwise
        """
        # Superusers have all permissions
        if self.is_superuser:
            return True

        # Check direct permissions
        if self.app_permissions.filter(codename=codename, is_active=True).exists():
            return True

        # Check permissions through groups
        user_groups = self.groups.all()
        if user_groups.exists():
            group_permission_ids = AppPermissionGroup.objects.filter(
                group__in=user_groups,
                permission__codename=codename,
                permission__is_active=True,
            ).values_list("permission_id", flat=True)

            if group_permission_ids:
                return True

        return False

    def has_any_app_permission(self, codenames):
        """
        Check if user has any of the specified app permissions.

        Args:
            codenames: List of permission codenames

        Returns:
            bool: True if user has at least one of the permissions
        """
        if self.is_superuser:
            return True

        for codename in codenames:
            if self.has_app_permission(codename):
                return True

        return False

    def has_all_app_permissions(self, codenames):
        """
        Check if user has all of the specified app permissions.

        Args:
            codenames: List of permission codenames

        Returns:
            bool: True if user has all of the permissions
        """
        if self.is_superuser:
            return True

        for codename in codenames:
            if not self.has_app_permission(codename):
                return False

        return True

    def get_app_permissions(self):
        """
        Get all app permissions for this user (direct + through groups).

        Returns:
            QuerySet: All AppPermission objects the user has
        """
        if self.is_superuser:
            return AppPermission.objects.filter(is_active=True)

        # Get direct permissions
        direct_permissions = self.app_permissions.filter(is_active=True)

        # Get permissions through groups
        user_groups = self.groups.all()
        group_permission_ids = AppPermissionGroup.objects.filter(
            group__in=user_groups,
            permission__is_active=True,
        ).values_list("permission_id", flat=True)

        # Combine and return unique permissions
        from django.db.models import Q

        return AppPermission.objects.filter(
            Q(id__in=direct_permissions.values_list("id", flat=True))
            | Q(id__in=group_permission_ids)
        ).distinct()
