"""Shared helpers for RBAC tests (PermissionBundle + ExtendedGroup + Django Permission)."""

import uuid

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType

from users.models import ExtendedGroup, PermissionBundle


def grant_user_permission_through_bundle(user, *, codename=None):
    """
    Create a Django Permission (on the User content type), a PermissionBundle containing it,
    a Group with ExtendedGroup wired to that bundle, and add ``user`` to the group.

    Returns the string to pass to ``user.has_perm()`` (``app_label.codename``).
    """
    UserModel = get_user_model()
    ct = ContentType.objects.get_for_model(UserModel)
    suffix = uuid.uuid4().hex[:8]
    codename = codename or f"rbac_test_perm_{suffix}"
    perm, _ = Permission.objects.get_or_create(
        codename=codename,
        content_type=ct,
        defaults={"name": f"Can {codename}"},
    )
    bundle = PermissionBundle.objects.create(
        name=f"Test bundle {suffix}",
        code=f"test_bundle_{suffix}",
        app="users",
    )
    bundle.permissions.add(perm)
    group = Group.objects.create(name=f"rbac_test_group_{suffix}")
    ext = ExtendedGroup.objects.create(group=group)
    ext.bundles.add(bundle)
    user.groups.add(group)
    return f"{ct.app_label}.{codename}"
