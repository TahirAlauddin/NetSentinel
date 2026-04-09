"""
Tests for BundlePermissionBackend.

Validates the 3-layer RBAC chain:
  user → group → ExtendedGroup → PermissionBundle → Django Permission

Edge cases:
- No groups / no ExtendedGroup / no bundles → correct permission behaviour
- Permissions from multiple bundles are unioned
- Bundle perms combine with direct user_permissions and standard group perms
- Superusers bypass the backend checks
- Inactive users always return False
- Permission cache invalidation
"""

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType

from users.backends import BundlePermissionBackend
from users.models import ExtendedGroup, PermissionBundle

User = get_user_model()


def _make_perm(codename, app_label="users", model="user"):
    ct, _ = ContentType.objects.get_or_create(app_label=app_label, model=model)
    perm, _ = Permission.objects.get_or_create(
        codename=codename, content_type=ct, defaults={"name": f"Can {codename}"}
    )
    return perm


def _make_bundle_with_perm(codename, code_suffix="", app="users"):
    perm = _make_perm(codename)
    bundle = PermissionBundle.objects.create(
        code=f"bundle_{codename}{code_suffix}",
        name=f"Bundle {codename}",
        app=app,
    )
    bundle.permissions.add(perm)
    return bundle, perm


def _make_group_with_bundle(group_name, bundle):
    group = Group.objects.create(name=group_name)
    ext = ExtendedGroup.objects.create(group=group)
    ext.bundles.add(bundle)
    return group


@pytest.mark.django_db
class TestBundlePermissionBackend:
    backend = BundlePermissionBackend()

    # ------------------------------------------------------------------
    # Basic resolution
    # ------------------------------------------------------------------

    def test_user_with_no_groups_has_no_bundle_perms(self):
        user = User.objects.create_user(username="ngrp", email="ngrp@x.com", password="p")
        perms = self.backend.get_group_permissions(user)
        assert perms == set()

    def test_user_in_group_without_extended_group_has_no_bundle_perms(self):
        group = Group.objects.create(name="plain_group")
        user = User.objects.create_user(username="plain_u", email="plain@x.com", password="p")
        user.groups.add(group)
        # No ExtendedGroup → backend should not raise, just return base perms (empty)
        perms = self.backend.get_group_permissions(user)
        assert perms == set()

    def test_user_in_group_with_empty_bundle_has_no_extra_perms(self):
        bundle = PermissionBundle.objects.create(code="empty_b", name="Empty Bundle")
        group = _make_group_with_bundle("empty_group", bundle)
        user = User.objects.create_user(username="empty_u", email="empty@x.com", password="p")
        user.groups.add(group)
        perms = self.backend.get_group_permissions(user)
        assert perms == set()

    def test_user_gets_permission_from_bundle(self):
        bundle, perm = _make_bundle_with_perm("can_do_x")
        group = _make_group_with_bundle("do_x_group", bundle)
        user = User.objects.create_user(username="do_x_u", email="dox@x.com", password="p")
        user.groups.add(group)

        perms = self.backend.get_group_permissions(user)
        assert "users.can_do_x" in perms

    def test_has_perm_returns_true_for_bundle_perm(self):
        bundle, perm = _make_bundle_with_perm("can_do_y")
        group = _make_group_with_bundle("do_y_group", bundle)
        user = User.objects.create_user(username="do_y_u", email="doy@x.com", password="p")
        user.groups.add(group)

        assert user.has_perm("users.can_do_y")

    def test_has_perm_returns_false_for_missing_bundle_perm(self):
        user = User.objects.create_user(username="no_perm_u", email="nop@x.com", password="p")
        assert not user.has_perm("users.nonexistent_perm_xyz")

    # ------------------------------------------------------------------
    # Union of multiple bundles / groups
    # ------------------------------------------------------------------

    def test_permissions_from_multiple_bundles_are_unioned(self):
        bundle1, _ = _make_bundle_with_perm("perm_alpha", "_1")
        bundle2, _ = _make_bundle_with_perm("perm_beta", "_2")
        group = Group.objects.create(name="multi_bundle_group")
        ext = ExtendedGroup.objects.create(group=group)
        ext.bundles.set([bundle1, bundle2])

        user = User.objects.create_user(username="multi_b", email="mb@x.com", password="p")
        user.groups.add(group)

        assert user.has_perm("users.perm_alpha")
        assert user.has_perm("users.perm_beta")

    def test_permissions_from_multiple_groups_are_unioned(self):
        bundle_a, _ = _make_bundle_with_perm("grp_perm_a", "_ga")
        bundle_b, _ = _make_bundle_with_perm("grp_perm_b", "_gb")
        group_a = _make_group_with_bundle("group_a", bundle_a)
        group_b = _make_group_with_bundle("group_b", bundle_b)

        user = User.objects.create_user(username="two_grp_u", email="tg@x.com", password="p")
        user.groups.set([group_a, group_b])

        assert user.has_perm("users.grp_perm_a")
        assert user.has_perm("users.grp_perm_b")

    def test_bundle_perms_combine_with_direct_user_permissions(self):
        bundle, _ = _make_bundle_with_perm("bundle_perm_z", "_z")
        group = _make_group_with_bundle("combo_group", bundle)

        direct_perm = _make_perm("direct_perm_z")
        user = User.objects.create_user(username="combo_u", email="combo@x.com", password="p")
        user.groups.add(group)
        user.user_permissions.add(direct_perm)

        assert user.has_perm("users.bundle_perm_z")
        assert user.has_perm("users.direct_perm_z")

    def test_bundle_perms_combine_with_standard_group_permissions(self):
        std_perm = _make_perm("std_group_perm")
        django_group = Group.objects.create(name="std_group_with_perm")
        django_group.permissions.add(std_perm)

        bundle, _ = _make_bundle_with_perm("bundle_extra_perm", "_ex")
        ext = ExtendedGroup.objects.create(group=django_group)
        ext.bundles.add(bundle)

        user = User.objects.create_user(username="std_combo_u", email="sc@x.com", password="p")
        user.groups.add(django_group)

        assert user.has_perm("users.std_group_perm")
        assert user.has_perm("users.bundle_extra_perm")

    # ------------------------------------------------------------------
    # Superuser / inactive edge cases
    # ------------------------------------------------------------------

    def test_superuser_has_all_permissions(self):
        su = User.objects.create_superuser(username="su_backend", email="su_b@x.com", password="p")
        assert su.has_perm("ipam.view_subnet")
        assert su.has_perm("assets.delete_asset")
        assert su.has_perm("contracts.add_contract")

    def test_inactive_user_has_no_permissions(self):
        bundle, _ = _make_bundle_with_perm("inactive_perm_test", "_in")
        group = _make_group_with_bundle("inactive_group", bundle)
        user = User.objects.create_user(
            username="inactive_be", email="inactive_be@x.com", password="p", is_active=False
        )
        user.groups.add(group)
        assert not user.has_perm("users.inactive_perm_test")

    # ------------------------------------------------------------------
    # Permission cache invalidation
    # ------------------------------------------------------------------

    def test_permission_cache_cleared_after_adding_group(self):
        bundle, _ = _make_bundle_with_perm("cache_perm_test", "_c")
        group = _make_group_with_bundle("cache_group", bundle)

        user = User.objects.create_user(username="cache_u", email="cache@x.com", password="p")
        assert not user.has_perm("users.cache_perm_test")

        user.groups.add(group)
        # Clear the permission cache that Django caches on the user object
        if hasattr(user, "_perm_cache"):
            del user._perm_cache
        if hasattr(user, "_user_perm_cache"):
            del user._user_perm_cache

        user = User.objects.get(pk=user.pk)
        assert user.has_perm("users.cache_perm_test")

    def test_permission_cache_cleared_after_adding_bundle(self):
        bundle = PermissionBundle.objects.create(code="late_bundle", name="Late Bundle")
        group = Group.objects.create(name="late_bundle_group")
        ext = ExtendedGroup.objects.create(group=group)
        ext.bundles.add(bundle)

        user = User.objects.create_user(username="late_u", email="late@x.com", password="p")
        user.groups.add(group)

        perm = _make_perm("late_added_perm")
        assert not user.has_perm("users.late_added_perm")

        bundle.permissions.add(perm)
        user = User.objects.get(pk=user.pk)
        assert user.has_perm("users.late_added_perm")

    # ------------------------------------------------------------------
    # get_all_permissions includes bundle perms
    # ------------------------------------------------------------------

    def test_get_all_permissions_includes_bundle_perms(self):
        bundle, _ = _make_bundle_with_perm("all_perms_test", "_all")
        group = _make_group_with_bundle("all_perms_group", bundle)
        user = User.objects.create_user(username="all_perms_u", email="ap@x.com", password="p")
        user.groups.add(group)

        all_perms = user.get_all_permissions()
        assert "users.all_perms_test" in all_perms

    def test_user_without_bundle_does_not_see_other_bundle_perm(self):
        bundle_a, _ = _make_bundle_with_perm("isolated_a", "_ia")
        bundle_b, _ = _make_bundle_with_perm("isolated_b", "_ib")

        group_a = _make_group_with_bundle("isolated_group_a", bundle_a)
        group_b = _make_group_with_bundle("isolated_group_b", bundle_b)

        user_a = User.objects.create_user(username="iso_a", email="ia@x.com", password="p")
        user_b = User.objects.create_user(username="iso_b", email="ib@x.com", password="p")
        user_a.groups.add(group_a)
        user_b.groups.add(group_b)

        assert user_a.has_perm("users.isolated_a")
        assert not user_a.has_perm("users.isolated_b")
        assert user_b.has_perm("users.isolated_b")
        assert not user_b.has_perm("users.isolated_a")

    # ------------------------------------------------------------------
    # App-label isolation via bundle
    # ------------------------------------------------------------------

    def test_ipam_bundle_perm_not_visible_as_assets_perm(self):
        """A permission in the ipam app label is only accessible as ipam.<codename>."""
        ct, _ = ContentType.objects.get_or_create(app_label="ipam", model="subnet")
        perm, _ = Permission.objects.get_or_create(
            codename="view_subnet_test",
            content_type=ct,
            defaults={"name": "Can view subnet test"},
        )
        bundle = PermissionBundle.objects.create(
            code="ipam_view_test", name="IPAM View Test", app="ipam"
        )
        bundle.permissions.add(perm)
        group = _make_group_with_bundle("ipam_test_group", bundle)
        user = User.objects.create_user(username="ipam_only", email="io@x.com", password="p")
        user.groups.add(group)

        assert user.has_perm("ipam.view_subnet_test")
        assert not user.has_perm("assets.view_subnet_test")
        assert not user.has_perm("contracts.view_subnet_test")
