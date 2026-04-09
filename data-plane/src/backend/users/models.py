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
