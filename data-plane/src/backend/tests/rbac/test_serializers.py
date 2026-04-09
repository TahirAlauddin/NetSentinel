"""
Tests for RBAC serializers:
  - PermissionSerializer
  - GroupSerializer / GroupDetailSerializer
  - PermissionBundleSerializer / PermissionBundleDetailSerializer
  - UserAssignmentsUpdateSerializer
"""

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from rest_framework.test import APIRequestFactory

from users.models import ExtendedGroup, PermissionBundle
from users.serializers import (
    GroupDetailSerializer,
    GroupSerializer,
    PermissionBundleDetailSerializer,
    PermissionBundleSerializer,
    PermissionSerializer,
    UserAssignmentsUpdateSerializer,
)

User = get_user_model()
factory = APIRequestFactory()


def _perm(codename, app_label="users", model="user"):
    ct, _ = ContentType.objects.get_or_create(app_label=app_label, model=model)
    p, _ = Permission.objects.get_or_create(
        codename=codename, content_type=ct, defaults={"name": f"Can {codename}"}
    )
    return p


def _bundle(code, name=None, perms=None, app="users"):
    b = PermissionBundle.objects.create(code=code, name=name or code, app=app)
    if perms:
        b.permissions.set(perms)
    return b


# ---------------------------------------------------------------------------
# PermissionSerializer
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPermissionSerializer:
    def test_fields_present(self):
        perm = _perm("ser_test_perm")
        data = PermissionSerializer(perm).data
        assert set(data.keys()) == {"id", "name", "codename", "content_type"}

    def test_codename_value(self):
        perm = _perm("codename_check")
        data = PermissionSerializer(perm).data
        assert data["codename"] == "codename_check"

    def test_content_type_is_pk(self):
        perm = _perm("ct_pk_check")
        data = PermissionSerializer(perm).data
        assert isinstance(data["content_type"], int)


# ---------------------------------------------------------------------------
# GroupSerializer
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestGroupSerializer:
    def test_basic_fields(self):
        group = Group.objects.create(name="SerGroup1")
        data = GroupSerializer(group).data
        assert "id" in data
        assert "name" in data
        assert "permissions" in data
        assert "user_count" in data
        assert "permission_bundle_ids" in data
        assert "app_level_permission_count" in data

    def test_user_count_correct(self):
        group = Group.objects.create(name="UserCountGroup")
        u1 = User.objects.create_user(username="uc1", email="uc1@x.com", password="p")
        u2 = User.objects.create_user(username="uc2", email="uc2@x.com", password="p")
        u1.groups.add(group)
        u2.groups.add(group)
        data = GroupSerializer(group).data
        assert data["user_count"] == 2

    def test_user_count_zero_for_empty_group(self):
        group = Group.objects.create(name="EmptyGroup")
        data = GroupSerializer(group).data
        assert data["user_count"] == 0

    def test_permission_bundle_ids_empty_without_extended_group(self):
        group = Group.objects.create(name="NoBundleGroup")
        data = GroupSerializer(group).data
        assert data["permission_bundle_ids"] == []

    def test_permission_bundle_ids_populated(self):
        bundle = _bundle("ser_bundle_id_test")
        group = Group.objects.create(name="BundleIdGroup")
        ext = ExtendedGroup.objects.create(group=group)
        ext.bundles.add(bundle)
        data = GroupSerializer(group).data
        assert bundle.pk in data["permission_bundle_ids"]

    def test_app_level_permission_count_zero_without_extended(self):
        group = Group.objects.create(name="NoExtGroup")
        data = GroupSerializer(group).data
        assert data["app_level_permission_count"] == 0

    def test_app_level_permission_count_single_app(self):
        bundle = _bundle("alpc_single", app="ipam")
        group = Group.objects.create(name="ALPCSingleGroup")
        ext = ExtendedGroup.objects.create(group=group)
        ext.bundles.add(bundle)
        data = GroupSerializer(group).data
        assert data["app_level_permission_count"] == 1

    def test_app_level_permission_count_multi_app(self):
        b1 = _bundle("alpc_ipam", app="ipam")
        b2 = _bundle("alpc_assets", app="assets")
        b3 = _bundle("alpc_contracts", app="contracts")
        group = Group.objects.create(name="ALPCMultiGroup")
        ext = ExtendedGroup.objects.create(group=group)
        ext.bundles.set([b1, b2, b3])
        data = GroupSerializer(group).data
        assert data["app_level_permission_count"] == 3

    def test_phone_management_mapped_to_phone_mgmt(self):
        b = _bundle("alpc_phone_mgmt", app="phone_management")
        group = Group.objects.create(name="ALPCPhoneGroup")
        ext = ExtendedGroup.objects.create(group=group)
        ext.bundles.add(b)
        data = GroupSerializer(group).data
        assert data["app_level_permission_count"] == 1

    def test_users_infrastructure_merged_in_ui_apps(self):
        b_users = _bundle("alpc_users_b", app="users")
        b_infra = _bundle("alpc_infra_b", app="infrastructure")
        group = Group.objects.create(name="ALPCUsersInfraGroup")
        ext = ExtendedGroup.objects.create(group=group)
        ext.bundles.set([b_users, b_infra])
        data = GroupSerializer(group).data
        # Both map to "users" in the UI, so count should be 1
        assert data["app_level_permission_count"] == 1

    def test_create_group_via_serializer(self):
        data = {"name": "NewSerGroup", "permissions": []}
        s = GroupSerializer(data=data)
        assert s.is_valid(), s.errors
        group = s.save()
        assert group.name == "NewSerGroup"

    def test_create_group_with_permission_bundle_ids(self):
        bundle = _bundle("create_with_bundle")
        request = factory.post("/")
        request.data = {"name": "GroupWithBundle", "permission_bundle_ids": [bundle.pk]}
        s = GroupSerializer(data={"name": "GroupWithBundle"}, context={"request": request})
        assert s.is_valid(), s.errors
        group = s.save()
        assert group.extended.bundles.filter(pk=bundle.pk).exists()

    def test_create_group_invalid_bundle_id_type(self):
        request = factory.post("/")
        request.data = {"name": "InvalidBundle", "permission_bundle_ids": ["notanint"]}
        s = GroupSerializer(data={"name": "InvalidBundle"}, context={"request": request})
        assert not s.is_valid()
        assert "permission_bundle_ids" in str(s.errors)

    def test_create_group_negative_bundle_id(self):
        request = factory.post("/")
        request.data = {"name": "NegBundle", "permission_bundle_ids": [-1]}
        s = GroupSerializer(data={"name": "NegBundle"}, context={"request": request})
        assert not s.is_valid()

    def test_update_group_bundles_via_serializer(self):
        bundle_old = _bundle("old_update_bundle")
        bundle_new = _bundle("new_update_bundle")
        group = Group.objects.create(name="UpdateBundleGroup")
        ext = ExtendedGroup.objects.create(group=group)
        ext.bundles.add(bundle_old)

        request = factory.patch("/")
        request.data = {"name": "UpdateBundleGroup", "permission_bundle_ids": [bundle_new.pk]}
        s = GroupSerializer(group, data={"name": "UpdateBundleGroup"}, context={"request": request})
        assert s.is_valid(), s.errors
        s.save()
        group.refresh_from_db()
        assert group.extended.bundles.filter(pk=bundle_new.pk).exists()
        assert not group.extended.bundles.filter(pk=bundle_old.pk).exists()

    def test_name_required(self):
        s = GroupSerializer(data={})
        assert not s.is_valid()
        assert "name" in s.errors


# ---------------------------------------------------------------------------
# GroupDetailSerializer
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestGroupDetailSerializer:
    def test_includes_permissions_detail(self):
        perm = _perm("detail_perm_test")
        group = Group.objects.create(name="DetailGroup")
        group.permissions.add(perm)
        data = GroupDetailSerializer(group).data
        assert "permissions_detail" in data
        codenames = [p["codename"] for p in data["permissions_detail"]]
        assert "detail_perm_test" in codenames

    def test_permissions_detail_empty_when_no_perms(self):
        group = Group.objects.create(name="NoPermDetailGroup")
        data = GroupDetailSerializer(group).data
        assert data["permissions_detail"] == []


# ---------------------------------------------------------------------------
# PermissionBundleSerializer
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPermissionBundleSerializer:
    def test_fields(self):
        bundle = _bundle("ser_bundle_fields")
        data = PermissionBundleSerializer(bundle).data
        assert set(data.keys()) == {"id", "name", "code", "app", "description", "permissions"}

    def test_create_bundle(self):
        s = PermissionBundleSerializer(data={"code": "new_bundle_ser", "name": "New Bundle Ser"})
        assert s.is_valid(), s.errors
        b = s.save()
        assert PermissionBundle.objects.filter(pk=b.pk).exists()

    def test_code_required(self):
        s = PermissionBundleSerializer(data={"name": "No Code Bundle"})
        assert not s.is_valid()
        assert "code" in s.errors

    def test_name_required(self):
        s = PermissionBundleSerializer(data={"code": "no_name_bundle"})
        assert not s.is_valid()
        assert "name" in s.errors

    def test_permissions_field_is_pk_list(self):
        perm = _perm("bundle_ser_perm")
        bundle = _bundle("bundle_with_perm_ser", perms=[perm])
        data = PermissionBundleSerializer(bundle).data
        assert perm.pk in data["permissions"]

    def test_update_bundle_permissions(self):
        perm_old = _perm("old_bundle_perm")
        perm_new = _perm("new_bundle_perm")
        bundle = _bundle("updatable_bundle", perms=[perm_old])

        s = PermissionBundleSerializer(
            bundle,
            data={
                "code": "updatable_bundle",
                "name": "Updatable Bundle",
                "permissions": [perm_new.pk],
            },
        )
        assert s.is_valid(), s.errors
        s.save()
        bundle.refresh_from_db()
        assert bundle.permissions.filter(pk=perm_new.pk).exists()
        assert not bundle.permissions.filter(pk=perm_old.pk).exists()


# ---------------------------------------------------------------------------
# PermissionBundleDetailSerializer
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPermissionBundleDetailSerializer:
    def test_includes_permissions_detail(self):
        perm = _perm("detail_bundle_perm")
        bundle = _bundle("detail_bundle_ser", perms=[perm])
        data = PermissionBundleDetailSerializer(bundle).data
        assert "permissions_detail" in data
        codenames = [p["codename"] for p in data["permissions_detail"]]
        assert "detail_bundle_perm" in codenames

    def test_permissions_detail_empty_without_perms(self):
        bundle = _bundle("empty_detail_bundle")
        data = PermissionBundleDetailSerializer(bundle).data
        assert data["permissions_detail"] == []


# ---------------------------------------------------------------------------
# UserAssignmentsUpdateSerializer
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestUserAssignmentsUpdateSerializer:
    def test_valid_payload(self):
        group = Group.objects.create(name="AssignGroup")
        perm = _perm("assign_perm")
        s = UserAssignmentsUpdateSerializer(
            data={"group_ids": [group.pk], "permission_ids": [perm.pk]}
        )
        assert s.is_valid(), s.errors

    def test_empty_lists_valid(self):
        s = UserAssignmentsUpdateSerializer(data={"group_ids": [], "permission_ids": []})
        assert s.is_valid(), s.errors

    def test_missing_group_ids_invalid(self):
        perm = _perm("assign_perm2")
        s = UserAssignmentsUpdateSerializer(data={"permission_ids": [perm.pk]})
        assert not s.is_valid()
        assert "group_ids" in s.errors

    def test_missing_permission_ids_invalid(self):
        group = Group.objects.create(name="AssignGroup2")
        s = UserAssignmentsUpdateSerializer(data={"group_ids": [group.pk]})
        assert not s.is_valid()
        assert "permission_ids" in s.errors

    def test_negative_group_id_invalid(self):
        s = UserAssignmentsUpdateSerializer(data={"group_ids": [-1], "permission_ids": []})
        assert not s.is_valid()

    def test_zero_group_id_invalid(self):
        s = UserAssignmentsUpdateSerializer(data={"group_ids": [0], "permission_ids": []})
        assert not s.is_valid()

    def test_string_id_invalid(self):
        s = UserAssignmentsUpdateSerializer(data={"group_ids": ["abc"], "permission_ids": []})
        assert not s.is_valid()
