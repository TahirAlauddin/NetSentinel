"""
Custom authentication backend that merges group permissions with
permissions from PermissionBundle (Layer 2) assigned to groups via ExtendedGroup.
So user.has_perm() resolves: user → group → bundles → permissions.
"""

from django.contrib.auth.backends import ModelBackend

from .models import ExtendedGroup

class BundlePermissionBackend(ModelBackend):
    """
    Extends ModelBackend so that get_group_permissions() includes permissions
    from PermissionBundle assigned to the user's groups via ExtendedGroup.
    """

    def get_group_permissions(self, user_obj, obj=None):
        perms = super().get_group_permissions(user_obj, obj)
        base_perms = set(perms)
        bundle_perms = set()

        for group in user_obj.groups.all():
            try:
                ext = group.extended
            except ExtendedGroup.DoesNotExist:
                continue

            for bundle in ext.bundles.prefetch_related("permissions__content_type"):
                for perm in bundle.permissions.all():
                    bundle_perms.add(f"{perm.content_type.app_label}.{perm.codename}")

        total_perms = base_perms | bundle_perms

        return total_perms
