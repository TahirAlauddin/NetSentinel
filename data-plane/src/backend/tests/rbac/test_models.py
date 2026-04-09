"""
Tests for RBAC models: PermissionBundle, ExtendedGroup, and their relationships.
"""

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.db import IntegrityError

from users.models import ExtendedGroup, PermissionBundle

User = get_user_model()


# ---------------------------------------------------------------------------
# PermissionBundle model
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPermissionBundleModel:
    def test_create_minimal(self):
        bundle = PermissionBundle.objects.create(code="test_minimal", name="Minimal Bundle")
        assert bundle.pk is not None
        assert bundle.code == "test_minimal"
        assert bundle.name == "Minimal Bundle"
        assert bundle.app is None
        assert bundle.description is None

    def test_str_representation(self):
        bundle = PermissionBundle.objects.create(code="str_test", name="My Bundle")
        assert str(bundle) == "My Bundle"

    def test_code_uniqueness(self):
        PermissionBundle.objects.create(code="unique_code", name="First")
        with pytest.raises(IntegrityError):
            PermissionBundle.objects.create(code="unique_code", name="Second")

    def test_name_uniqueness(self):
        PermissionBundle.objects.create(code="code_a", name="Same Name")
        with pytest.raises(IntegrityError):
            PermissionBundle.objects.create(code="code_b", name="Same Name")

    def test_app_field_stored(self):
        bundle = PermissionBundle.objects.create(code="ipam_bundle", name="IPAM Bundle", app="ipam")
        assert bundle.app == "ipam"

    def test_description_stored(self):
        bundle = PermissionBundle.objects.create(
            code="desc_bundle", name="Desc Bundle", description="Grants IPAM read access."
        )
        assert "IPAM" in bundle.description

    def test_add_permissions(self, db):
        ct = ContentType.objects.get_for_model(User)
        perm, _ = Permission.objects.get_or_create(
            codename="can_view_reports", content_type=ct, defaults={"name": "Can view reports"}
        )
        bundle = PermissionBundle.objects.create(code="perm_bundle", name="Perm Bundle")
        bundle.permissions.add(perm)
        assert perm in bundle.permissions.all()

    def test_permissions_many_to_many(self, db):
        ct = ContentType.objects.get_for_model(User)
        perms = []
        for i in range(3):
            p, _ = Permission.objects.get_or_create(
                codename=f"test_perm_{i}", content_type=ct, defaults={"name": f"Test perm {i}"}
            )
            perms.append(p)
        bundle = PermissionBundle.objects.create(code="multi_perm", name="Multi Perm")
        bundle.permissions.set(perms)
        assert bundle.permissions.count() == 3

    def test_default_ordering(self):
        PermissionBundle.objects.create(code="z_bundle", name="Z Bundle", app="zzz")
        PermissionBundle.objects.create(code="a_bundle", name="A Bundle", app="aaa")
        codes = list(PermissionBundle.objects.values_list("code", flat=True))
        assert codes.index("a_bundle") < codes.index("z_bundle")

    def test_db_table_name(self):
        assert PermissionBundle._meta.db_table == "users_permission_bundle"


# ---------------------------------------------------------------------------
# ExtendedGroup model
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestExtendedGroupModel:
    def test_create_extended_group(self):
        group = Group.objects.create(name="TestGroup")
        ext = ExtendedGroup.objects.create(group=group)
        assert ext.pk is not None
        assert ext.group == group

    def test_str_representation(self):
        group = Group.objects.create(name="MyGroup")
        ext = ExtendedGroup.objects.create(group=group)
        assert str(ext) == "Extended: MyGroup"

    def test_one_to_one_with_group(self):
        group = Group.objects.create(name="OTOGroup")
        ExtendedGroup.objects.create(group=group)
        with pytest.raises(IntegrityError):
            ExtendedGroup.objects.create(group=group)

    def test_reverse_relation_from_group(self):
        group = Group.objects.create(name="ReverseGroup")
        ext = ExtendedGroup.objects.create(group=group)
        assert group.extended == ext

    def test_cascade_delete_on_group_delete(self):
        group = Group.objects.create(name="CascadeGroup")
        ext = ExtendedGroup.objects.create(group=group)
        ext_pk = ext.pk
        group.delete()
        assert not ExtendedGroup.objects.filter(pk=ext_pk).exists()

    def test_add_bundles_to_extended_group(self):
        bundle = PermissionBundle.objects.create(code="eg_bundle", name="EG Bundle")
        group = Group.objects.create(name="BundleGroup")
        ext = ExtendedGroup.objects.create(group=group)
        ext.bundles.add(bundle)
        assert bundle in ext.bundles.all()

    def test_multiple_bundles(self):
        group = Group.objects.create(name="MultiBundleGroup")
        ext = ExtendedGroup.objects.create(group=group)
        bundles = [
            PermissionBundle.objects.create(code=f"mb_{i}", name=f"Multi Bundle {i}")
            for i in range(4)
        ]
        ext.bundles.set(bundles)
        assert ext.bundles.count() == 4

    def test_bundle_reverse_relation(self):
        bundle = PermissionBundle.objects.create(code="rev_bundle", name="Rev Bundle")
        group = Group.objects.create(name="RevGroup")
        ext = ExtendedGroup.objects.create(group=group)
        ext.bundles.add(bundle)
        assert ext in bundle.extended_groups.all()

    def test_db_table_name(self):
        assert ExtendedGroup._meta.db_table == "users_extended_group"

    def test_group_without_extended_raises_does_not_exist(self):
        group = Group.objects.create(name="PlainGroup")
        with pytest.raises(ExtendedGroup.DoesNotExist):
            _ = group.extended


# ---------------------------------------------------------------------------
# User model (RBAC-relevant aspects)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestUserModel:
    def test_user_groups_assignment(self):
        user = User.objects.create_user(username="grp_user", email="grp@x.com", password="pass")
        group = Group.objects.create(name="UserGroup")
        user.groups.add(group)
        assert group in user.groups.all()

    def test_user_direct_permissions(self):
        user = User.objects.create_user(username="perm_user", email="perm@x.com", password="pass")
        ct = ContentType.objects.get_for_model(User)
        perm, _ = Permission.objects.get_or_create(
            codename="direct_perm", content_type=ct, defaults={"name": "Direct perm"}
        )
        user.user_permissions.add(perm)
        user_fresh = User.objects.get(pk=user.pk)
        assert user_fresh.has_perm("users.direct_perm")

    def test_superuser_has_all_permissions(self):
        su = User.objects.create_superuser(
            username="su_model", email="su_model@x.com", password="pass"
        )
        assert su.has_perm("ipam.view_subnet")
        assert su.has_perm("assets.add_asset")
        assert su.has_perm("contracts.delete_contract")

    def test_inactive_user_has_no_permissions(self):
        user = User.objects.create_user(
            username="inactive_perm",
            email="inactive_perm@x.com",
            password="pass",
            is_active=False,
        )
        ct = ContentType.objects.get_for_model(User)
        perm, _ = Permission.objects.get_or_create(
            codename="inactive_test", content_type=ct, defaults={"name": "Inactive test"}
        )
        user.user_permissions.add(perm)
        assert not user.has_perm("users.inactive_test")

    def test_email_uniqueness(self):
        User.objects.create_user(username="email1", email="dup@x.com", password="pass")
        with pytest.raises(IntegrityError):
            User.objects.create_user(username="email2", email="dup@x.com", password="pass")

    def test_str_representation(self):
        user = User.objects.create_user(
            username="str_u",
            email="str_u@x.com",
            password="pass",
            first_name="John",
            last_name="Doe",
        )
        assert "John" in str(user) and "Doe" in str(user)

    def test_get_full_name(self):
        user = User.objects.create_user(
            username="fn_u",
            email="fn@x.com",
            password="pass",
            first_name="Alice",
            last_name="Smith",
        )
        assert user.get_full_name() == "Alice Smith"

    def test_get_short_name(self):
        user = User.objects.create_user(
            username="sn_u", email="sn@x.com", password="pass", first_name="Bob"
        )
        assert user.get_short_name() == "Bob"
