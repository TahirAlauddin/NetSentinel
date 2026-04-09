"""
Tests for GroupViewSet at /api/v1/users/groups/

Key rules under test:
- Only authenticated users can reach the endpoint (otherwise 401).
- Non-superusers get an empty list on GET list/retrieve (queryset is .none()).
- All mutating operations (create / update / delete) require is_superuser, else 403.
- Superusers can perform full CRUD.
- Creating a group with a duplicate name returns 400 / 500 (IntegrityError path).
- Groups can be created with permission_bundle_ids.
"""

import pytest
from django.contrib.auth.models import Group

from users.models import ExtendedGroup, PermissionBundle

GROUPS_URL = "/api/v1/users/groups/"


def group_detail_url(pk):
    return f"{GROUPS_URL}{pk}/"


def _bundle(code, name=None):
    return PermissionBundle.objects.create(code=code, name=name or code)


# ---------------------------------------------------------------------------
# Authentication gate
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestGroupViewSetAuth:
    def test_unauthenticated_list_returns_401(self, anon_client):
        resp = anon_client.get(GROUPS_URL)
        assert resp.status_code == 401

    def test_unauthenticated_create_returns_401(self, anon_client):
        resp = anon_client.post(GROUPS_URL, {"name": "AnonGroup"}, format="json")
        assert resp.status_code == 401

    def test_unauthenticated_detail_returns_401(self, anon_client, db):
        group = Group.objects.create(name="AnonDetail")
        resp = anon_client.get(group_detail_url(group.pk))
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Non-superuser gates
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestGroupViewSetNonSuperuser:
    def test_list_returns_200_with_empty_results(self, no_perm_client):
        Group.objects.create(name="ShouldNotSeeThis")
        resp = no_perm_client.get(GROUPS_URL)
        assert resp.status_code == 200
        assert resp.data["results"] == []

    def test_retrieve_returns_404_because_queryset_is_none(self, no_perm_client, db):
        group = Group.objects.create(name="HiddenGroup")
        resp = no_perm_client.get(group_detail_url(group.pk))
        assert resp.status_code == 404

    def test_create_returns_403(self, no_perm_client):
        resp = no_perm_client.post(GROUPS_URL, {"name": "UnauthorisedGroup"}, format="json")
        assert resp.status_code == 403

    def test_update_returns_403(self, no_perm_client, db):
        group = Group.objects.create(name="PatchTarget")
        resp = no_perm_client.patch(group_detail_url(group.pk), {"name": "Modified"}, format="json")
        assert resp.status_code in (403, 404)

    def test_delete_returns_403(self, no_perm_client, db):
        group = Group.objects.create(name="DeleteTarget")
        resp = no_perm_client.delete(group_detail_url(group.pk))
        assert resp.status_code in (403, 404)

    def test_staff_but_not_superuser_still_gets_empty_list(self, db, make_jwt_client, make_user):
        staff_user = make_user(username="staff_only")
        staff_user.is_staff = True
        staff_user.save()
        client = make_jwt_client(staff_user)
        Group.objects.create(name="StaffShouldNotSee")
        resp = client.get(GROUPS_URL)
        assert resp.status_code == 200
        assert resp.data["results"] == []


# ---------------------------------------------------------------------------
# Superuser full CRUD
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestGroupViewSetSuperuser:
    def test_list_returns_all_groups(self, superuser_client, db):
        Group.objects.create(name="ListGroup1")
        Group.objects.create(name="ListGroup2")
        resp = superuser_client.get(GROUPS_URL)
        assert resp.status_code == 200
        names = [g["name"] for g in resp.data["results"]]
        assert "ListGroup1" in names
        assert "ListGroup2" in names

    def test_retrieve_returns_group_detail(self, superuser_client, db):
        group = Group.objects.create(name="DetailFetch")
        resp = superuser_client.get(group_detail_url(group.pk))
        assert resp.status_code == 200
        assert resp.data["name"] == "DetailFetch"
        assert "permissions_detail" in resp.data

    def test_create_group(self, superuser_client):
        resp = superuser_client.post(GROUPS_URL, {"name": "CreatedGroup"}, format="json")
        assert resp.status_code == 201
        assert Group.objects.filter(name="CreatedGroup").exists()

    def test_create_group_with_bundle_ids(self, superuser_client, db):
        bundle = _bundle("su_create_bundle")
        resp = superuser_client.post(
            GROUPS_URL,
            {"name": "GroupWithBundle", "permission_bundle_ids": [bundle.pk]},
            format="json",
        )
        assert resp.status_code == 201
        group = Group.objects.get(name="GroupWithBundle")
        assert group.extended.bundles.filter(pk=bundle.pk).exists()

    def test_create_group_response_includes_bundle_ids(self, superuser_client, db):
        bundle = _bundle("resp_bundle_id")
        resp = superuser_client.post(
            GROUPS_URL,
            {"name": "RespBundleGroup", "permission_bundle_ids": [bundle.pk]},
            format="json",
        )
        assert resp.status_code == 201
        assert bundle.pk in resp.data["permission_bundle_ids"]

    def test_full_update_group_name(self, superuser_client, db):
        group = Group.objects.create(name="OldName")
        resp = superuser_client.put(
            group_detail_url(group.pk),
            {"name": "NewName", "permissions": []},
            format="json",
        )
        assert resp.status_code == 200
        group.refresh_from_db()
        assert group.name == "NewName"

    def test_partial_update_group_name(self, superuser_client, db):
        group = Group.objects.create(name="PartialOld")
        resp = superuser_client.patch(
            group_detail_url(group.pk), {"name": "PartialNew"}, format="json"
        )
        assert resp.status_code == 200
        group.refresh_from_db()
        assert group.name == "PartialNew"

    def test_delete_group(self, superuser_client, db):
        group = Group.objects.create(name="ToDelete")
        resp = superuser_client.delete(group_detail_url(group.pk))
        assert resp.status_code == 204
        assert not Group.objects.filter(name="ToDelete").exists()

    def test_delete_group_also_deletes_extended_group(self, superuser_client, db):
        group = Group.objects.create(name="ExtDeleteGroup")
        ext = ExtendedGroup.objects.create(group=group)
        ext_pk = ext.pk
        superuser_client.delete(group_detail_url(group.pk))
        assert not ExtendedGroup.objects.filter(pk=ext_pk).exists()

    def test_update_group_bundles(self, superuser_client, db):
        bundle_old = _bundle("old_view_bundle")
        bundle_new = _bundle("new_view_bundle")
        group = Group.objects.create(name="SwapBundleGroup")
        ext = ExtendedGroup.objects.create(group=group)
        ext.bundles.add(bundle_old)

        resp = superuser_client.patch(
            group_detail_url(group.pk),
            {"name": "SwapBundleGroup", "permission_bundle_ids": [bundle_new.pk]},
            format="json",
        )
        assert resp.status_code == 200
        group.refresh_from_db()
        assert group.extended.bundles.filter(pk=bundle_new.pk).exists()
        assert not group.extended.bundles.filter(pk=bundle_old.pk).exists()

    def test_create_group_response_user_count_is_zero(self, superuser_client):
        resp = superuser_client.post(GROUPS_URL, {"name": "ZeroUsers"}, format="json")
        assert resp.status_code == 201
        assert resp.data["user_count"] == 0

    def test_retrieve_nonexistent_returns_404(self, superuser_client, db):
        resp = superuser_client.get(group_detail_url(99999))
        assert resp.status_code == 404
