from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models



class PermissionBundle(models.Model):
    """
    Layer 2 — Permission Bundles (subgroups).
    Groups Django's atomic permissions into named bundles (e.g. view_ipam, edit_monitoring)
    for UX-friendly role assignment. Used by ExtendedGroup.
    """

    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Human-readable bundle name (e.g. 'View IPAM')",
    )
    code = models.CharField(
        max_length=100,
        unique=True,
        help_text="Unique code for this bundle (e.g. 'view_ipam', 'edit_monitoring')",
    )
    permissions = models.ManyToManyField(
        Permission,
        related_name="bundles",
        blank=True,
        help_text="Django permissions included in this bundle",
    )
    app = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Optional app label for filtering in UI (e.g. 'ipam', 'monitoring')",
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Optional description of what this bundle grants",
    )

    class Meta:
        db_table = "users_permission_bundle"
        verbose_name = "Permission Bundle"
        verbose_name_plural = "Permission Bundles"
        ordering = ["app", "code"]

    def __str__(self):
        return self.name


class ExtendedGroup(models.Model):
    """
    Layer 3 — Extended Group (role).
    One-to-one with Django Group; adds many-to-many to PermissionBundle
    so that has_perm() resolves: user → group → bundles → permissions.
    """

    group = models.OneToOneField(
        Group,
        on_delete=models.CASCADE,
        related_name="extended",
        help_text="Django Group this extension belongs to",
    )
    bundles = models.ManyToManyField(
        PermissionBundle,
        related_name="extended_groups",
        blank=True,
        help_text="Permission bundles (subgroups) assigned to this role",
    )

    class Meta:
        db_table = "users_extended_group"
        verbose_name = "Extended Group"
        verbose_name_plural = "Extended Groups"

    def __str__(self):
        return f"Extended: {self.group.name}"


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
        db_table="users_user_app_permissions_many_to_many",
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
