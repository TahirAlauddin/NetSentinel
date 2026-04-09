"""
Tests for user_assignments_view at /api/v1/users/<user_id>/assignments/

Covers:
- Authentication and superuser gates
- GET: read a user's current group_ids and permission_ids
- PUT: replace a user's groups and direct permissions
- Edge cases: missing user, empty payload, invalid payload
- Verify that setting groups/perms actually propagates to has_perm()
"""

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType

from users.models import ExtendedGroup, PermissionBundle

User = get_user_model()


def assignments_url(user_id):
    return f"/api/v1/users/{user_id}/assignments/"


def _perm(codename, app_label="users", model="user"):
    ct, _ = ContentType.objects.get_or_create(app_label=app_label, model=model)
    p, _ = Permission.objects.get_or_create(
        codename=codename, content_type=ct, defaults={"name": f"Can {codename}"}
    )
    return p


def _make_target_user(username="target_user"):
    return User.objects.create_user(username=username, email=f"{username}@x.com", password="pass")


# ---------------------------------------------------------------------------
# Authentication and superuser gate
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestAssignmentsViewAuth:
    def test_unauthenticated_get_returns_401(self, anon_client, db):
        user = _make_target_user("anon_target")
        resp = anon_client.get(assignments_url(user.pk))
        assert resp.status_code == 401

    def test_unauthenticated_put_returns_401(self, anon_client, db):
        user = _make_target_user("anon_target_put")
        resp = anon_client.put(
            assignments_url(user.pk),
            {"group_ids": [], "permission_ids": []},
            format="json",
        )
        assert resp.status_code == 401

    def test_non_superuser_get_returns_403(self, no_perm_client, db):
        target = _make_target_user("nsup_get_target")
        resp = no_perm_client.get(assignments_url(target.pk))
        assert resp.status_code == 403

    def test_non_superuser_put_returns_403(self, no_perm_client, db):
        target = _make_target_user("nsup_put_target")
        resp = no_perm_client.put(
            assignments_url(target.pk),
            {"group_ids": [], "permission_ids": []},
            format="json",
        )
        assert resp.status_code == 403

    def test_staff_non_superuser_returns_403(self, db, make_user, make_jwt_client):
        staff = make_user(username="staff_asgn")
        staff.is_staff = True
        staff.save()
        client = make_jwt_client(staff)
        target = _make_target_user("staff_target")
        resp = client.get(assignments_url(target.pk))
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Superuser GET
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestAssignmentsViewGet:
    def test_get_returns_user_group_ids(self, superuser_client, db):
        target = _make_target_user("get_group_target")
        group = Group.objects.create(name="GetGroup")
        target.groups.add(group)
        resp = superuser_client.get(assignments_url(target.pk))
        assert resp.status_code == 200
        assert group.pk in resp.data["group_ids"]

    def test_get_returns_user_permission_ids(self, superuser_client, db):
        target = _make_target_user("get_perm_target")
        perm = _perm("get_direct_perm")
        target.user_permissions.add(perm)
        resp = superuser_client.get(assignments_url(target.pk))
        assert resp.status_code == 200
        assert perm.pk in resp.data["permission_ids"]

    def test_get_returns_empty_for_user_with_no_assignments(self, superuser_client, db):
        target = _make_target_user("empty_asgn_target")
        resp = superuser_client.get(assignments_url(target.pk))
        assert resp.status_code == 200
        assert resp.data["group_ids"] == []
        assert resp.data["permission_ids"] == []

    def test_get_user_not_found_returns_404(self, superuser_client):
        resp = superuser_client.get(assignments_url(99999))
        assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Superuser PUT
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestAssignmentsViewPut:
    def test_put_assigns_groups(self, superuser_client, db):
        target = _make_target_user("put_grp_target")
        group = Group.objects.create(name="AssignedGroup")
        resp = superuser_client.put(
            assignments_url(target.pk),
            {"group_ids": [group.pk], "permission_ids": []},
            format="json",
        )
        assert resp.status_code == 200
        assert group.pk in resp.data["group_ids"]
        target.refresh_from_db()
        assert target.groups.filter(pk=group.pk).exists()

    def test_put_assigns_direct_permissions(self, superuser_client, db):
        target = _make_target_user("put_perm_target")
        perm = _perm("put_direct_assign_perm")
        resp = superuser_client.put(
            assignments_url(target.pk),
            {"group_ids": [], "permission_ids": [perm.pk]},
            format="json",
        )
        assert resp.status_code == 200
        assert perm.pk in resp.data["permission_ids"]
        target.refresh_from_db()
        assert target.user_permissions.filter(pk=perm.pk).exists()

    def test_put_clears_existing_groups(self, superuser_client, db):
        target = _make_target_user("clear_grp_target")
        old_group = Group.objects.create(name="OldGroup")
        target.groups.add(old_group)
        resp = superuser_client.put(
            assignments_url(target.pk),
            {"group_ids": [], "permission_ids": []},
            format="json",
        )
        assert resp.status_code == 200
        target.refresh_from_db()
        assert not target.groups.filter(pk=old_group.pk).exists()

    def test_put_clears_existing_direct_permissions(self, superuser_client, db):
        target = _make_target_user("clear_perm_target")
        old_perm = _perm("old_clear_perm")
        target.user_permissions.add(old_perm)
        resp = superuser_client.put(
            assignments_url(target.pk),
            {"group_ids": [], "permission_ids": []},
            format="json",
        )
        assert resp.status_code == 200
        target.refresh_from_db()
        assert not target.user_permissions.filter(pk=old_perm.pk).exists()

    def test_put_replaces_groups_not_appends(self, superuser_client, db):
        target = _make_target_user("replace_grp_target")
        old_group = Group.objects.create(name="OldReplaceGroup")
        new_group = Group.objects.create(name="NewReplaceGroup")
        target.groups.add(old_group)
        superuser_client.put(
            assignments_url(target.pk),
            {"group_ids": [new_group.pk], "permission_ids": []},
            format="json",
        )
        target.refresh_from_db()
        assert target.groups.filter(pk=new_group.pk).exists()
        assert not target.groups.filter(pk=old_group.pk).exists()

    def test_put_nonexistent_user_returns_404(self, superuser_client):
        resp = superuser_client.put(
            assignments_url(99999),
            {"group_ids": [], "permission_ids": []},
            format="json",
        )
        assert resp.status_code == 404

    def test_put_missing_group_ids_returns_400(self, superuser_client, db):
        target = _make_target_user("bad_payload_target")
        resp = superuser_client.put(
            assignments_url(target.pk), {"permission_ids": []}, format="json"
        )
        assert resp.status_code == 400

    def test_put_missing_permission_ids_returns_400(self, superuser_client, db):
        target = _make_target_user("bad_perm_payload")
        resp = superuser_client.put(assignments_url(target.pk), {"group_ids": []}, format="json")
        assert resp.status_code == 400

    def test_put_nonexistent_group_id_silently_ignored(self, superuser_client, db):
        """Django Group.objects.filter(id__in=[...]) silently ignores missing IDs."""
        target = _make_target_user("nonexist_grp_target")
        resp = superuser_client.put(
            assignments_url(target.pk),
            {"group_ids": [99999], "permission_ids": []},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.data["group_ids"] == []

    def test_put_propagates_permissions_to_has_perm(self, superuser_client, db):
        """After PUT, the user should have the new perm via has_perm()."""
        target = _make_target_user("hasperm_target")
        perm = _perm("propagated_perm")
        superuser_client.put(
            assignments_url(target.pk),
            {"group_ids": [], "permission_ids": [perm.pk]},
            format="json",
        )
        target = User.objects.get(pk=target.pk)
        assert target.has_perm("users.propagated_perm")

    def test_put_with_bundle_group_grants_bundle_perms(self, superuser_client, db):
        """Assigning a group that has a bundle propagates bundle perms."""
        bundle_perm = _perm("assigned_bundle_perm")
        bundle = PermissionBundle.objects.create(
            code="assign_bundle", name="Assign Bundle", app="users"
        )
        bundle.permissions.add(bundle_perm)
        group = Group.objects.create(name="BundleAssignGroup")
        ext = ExtendedGroup.objects.create(group=group)
        ext.bundles.add(bundle)

        target = _make_target_user("bundle_assign_target")
        superuser_client.put(
            assignments_url(target.pk),
            {"group_ids": [group.pk], "permission_ids": []},
            format="json",
        )
        target = User.objects.get(pk=target.pk)
        assert target.has_perm("users.assigned_bundle_perm")

    def test_put_response_includes_success_true(self, superuser_client, db):
        target = _make_target_user("success_flag_target")
        resp = superuser_client.put(
            assignments_url(target.pk),
            {"group_ids": [], "permission_ids": []},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.data["success"] is True
