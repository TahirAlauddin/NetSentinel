"""
Tests for app-level group create/update views:
  POST /api/v1/users/groups/app-level/
  PUT  /api/v1/users/groups/<group_id>/app-level/

These views translate UI app+level selections (e.g. {app: "ipam", level: "read"})
into Django permissions and auto-generated PermissionBundles, then create/update a Group.

Edge cases:
- superuser gate
- missing name → 400
- unknown app key → 400
- invalid level → 400
- level=none is skipped
- read/edit/admin levels produce the correct permission prefix sets
- duplicate group name → 400
- update non-existent group → 404
"""

import pytest
from django.contrib.auth.models import Group

from users.models import ExtendedGroup, PermissionBundle

CREATE_URL = "/api/v1/users/groups/app-level/"


def update_url(group_id):
    return f"/api/v1/users/groups/{group_id}/app-level/"


def _has_perms_starting_with(group, prefix, app_label):
    return group.permissions.filter(
        content_type__app_label=app_label, codename__startswith=prefix
    ).exists()


# ---------------------------------------------------------------------------
# Authentication and superuser gate
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestAppLevelGroupCreateAuth:
    def test_unauthenticated_returns_401(self, anon_client):
        resp = anon_client.post(CREATE_URL, {"name": "X"}, format="json")
        assert resp.status_code == 401

    def test_non_superuser_returns_403(self, no_perm_client):
        resp = no_perm_client.post(CREATE_URL, {"name": "X"}, format="json")
        assert resp.status_code == 403

    def test_staff_non_superuser_returns_403(self, db, make_user, make_jwt_client):
        staff = make_user(username="staff_aplv")
        staff.is_staff = True
        staff.save()
        client = make_jwt_client(staff)
        resp = client.post(CREATE_URL, {"name": "X"}, format="json")
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# Validation errors on create
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestAppLevelGroupCreateValidation:
    def test_missing_name_returns_400(self, superuser_client):
        resp = superuser_client.post(
            CREATE_URL,
            {"app_access_levels": [{"app": "ipam", "level": "read"}]},
            format="json",
        )
        assert resp.status_code == 400
        assert "name" in resp.data.get("error", "").lower()

    def test_blank_name_returns_400(self, superuser_client):
        resp = superuser_client.post(
            CREATE_URL,
            {"name": "   ", "app_access_levels": []},
            format="json",
        )
        assert resp.status_code == 400

    def test_unknown_app_key_returns_400(self, superuser_client):
        resp = superuser_client.post(
            CREATE_URL,
            {
                "name": "BadApp",
                "app_access_levels": [{"app": "nonexistent_app", "level": "read"}],
            },
            format="json",
        )
        assert resp.status_code == 400
        assert "nonexistent_app" in resp.data.get("error", "")

    def test_invalid_level_returns_400(self, superuser_client):
        resp = superuser_client.post(
            CREATE_URL,
            {
                "name": "BadLevel",
                "app_access_levels": [{"app": "ipam", "level": "superpower"}],
            },
            format="json",
        )
        assert resp.status_code == 400
        assert "superpower" in resp.data.get("error", "")

    def test_app_access_levels_must_be_list(self, superuser_client):
        resp = superuser_client.post(
            CREATE_URL,
            {"name": "NotList", "app_access_levels": "not-a-list"},
            format="json",
        )
        assert resp.status_code == 400

    def test_each_item_must_be_dict(self, superuser_client):
        resp = superuser_client.post(
            CREATE_URL,
            {"name": "BadItems", "app_access_levels": ["ipam"]},
            format="json",
        )
        assert resp.status_code == 400

    def test_duplicate_name_returns_400(self, superuser_client, db):
        Group.objects.create(name="DupGroup")
        resp = superuser_client.post(
            CREATE_URL, {"name": "DupGroup", "app_access_levels": []}, format="json"
        )
        assert resp.status_code == 400
        assert "already exists" in resp.data.get("error", "").lower()


# ---------------------------------------------------------------------------
# Successful create
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestAppLevelGroupCreate:
    def test_create_with_empty_access_levels(self, superuser_client):
        resp = superuser_client.post(
            CREATE_URL, {"name": "EmptyAccessGroup", "app_access_levels": []}, format="json"
        )
        assert resp.status_code == 201
        assert Group.objects.filter(name="EmptyAccessGroup").exists()
        assert resp.data["success"] is True

    def test_create_returns_group_id(self, superuser_client):
        resp = superuser_client.post(
            CREATE_URL, {"name": "IdGroup", "app_access_levels": []}, format="json"
        )
        assert resp.status_code == 201
        assert "id" in resp.data
        assert Group.objects.filter(pk=resp.data["id"]).exists()

    def test_level_none_skipped(self, superuser_client):
        resp = superuser_client.post(
            CREATE_URL,
            {
                "name": "NoneLevel",
                "app_access_levels": [{"app": "ipam", "level": "none"}],
            },
            format="json",
        )
        assert resp.status_code == 201
        group = Group.objects.get(name="NoneLevel")
        assert group.permissions.count() == 0

    def test_read_level_grants_only_view_permissions(self, superuser_client):
        resp = superuser_client.post(
            CREATE_URL,
            {
                "name": "IPAMReadGroup",
                "app_access_levels": [{"app": "ipam", "level": "read"}],
            },
            format="json",
        )
        assert resp.status_code == 201
        group = Group.objects.get(name="IPAMReadGroup")
        perms = group.permissions.filter(content_type__app_label="ipam")
        # All assigned ipam perms should be view_ only
        assert perms.exists()
        for perm in perms:
            assert perm.codename.startswith("view_"), f"Expected view_ only, got: {perm.codename}"

    def test_edit_level_grants_view_and_change_permissions(self, superuser_client):
        resp = superuser_client.post(
            CREATE_URL,
            {
                "name": "AssetsEditGroup",
                "app_access_levels": [{"app": "assets", "level": "edit"}],
            },
            format="json",
        )
        assert resp.status_code == 201
        group = Group.objects.get(name="AssetsEditGroup")
        perms = group.permissions.filter(content_type__app_label="assets")
        codenames = set(perms.values_list("codename", flat=True))
        has_view = any(c.startswith("view_") for c in codenames)
        has_change = any(c.startswith("change_") for c in codenames)
        has_add = any(c.startswith("add_") for c in codenames)
        has_delete = any(c.startswith("delete_") for c in codenames)
        assert has_view, "edit level should include view_ perms"
        assert has_change, "edit level should include change_ perms"
        assert not has_add, "edit level should NOT include add_ perms"
        assert not has_delete, "edit level should NOT include delete_ perms"

    def test_admin_level_grants_all_crud_permissions(self, superuser_client):
        resp = superuser_client.post(
            CREATE_URL,
            {
                "name": "ContractsAdminGroup",
                "app_access_levels": [{"app": "contracts", "level": "admin"}],
            },
            format="json",
        )
        assert resp.status_code == 201
        group = Group.objects.get(name="ContractsAdminGroup")
        perms = group.permissions.filter(content_type__app_label="contracts")
        codenames = set(perms.values_list("codename", flat=True))
        assert any(c.startswith("view_") for c in codenames)
        assert any(c.startswith("add_") for c in codenames)
        assert any(c.startswith("change_") for c in codenames)
        assert any(c.startswith("delete_") for c in codenames)

    def test_create_generates_auto_bundle(self, superuser_client):
        resp = superuser_client.post(
            CREATE_URL,
            {
                "name": "AutoBundleGroup",
                "app_access_levels": [{"app": "ipam", "level": "read"}],
            },
            format="json",
        )
        assert resp.status_code == 201
        assert PermissionBundle.objects.filter(code="ipam_read_all").exists()

    def test_create_wires_bundle_to_extended_group(self, superuser_client):
        resp = superuser_client.post(
            CREATE_URL,
            {
                "name": "WiredBundleGroup",
                "app_access_levels": [{"app": "assets", "level": "admin"}],
            },
            format="json",
        )
        assert resp.status_code == 201
        group = Group.objects.get(name="WiredBundleGroup")
        assert ExtendedGroup.objects.filter(group=group).exists()
        assert group.extended.bundles.exists()

    def test_multi_app_access_levels(self, superuser_client):
        resp = superuser_client.post(
            CREATE_URL,
            {
                "name": "MultiAppGroup",
                "app_access_levels": [
                    {"app": "ipam", "level": "read"},
                    {"app": "assets", "level": "edit"},
                    {"app": "contracts", "level": "admin"},
                ],
            },
            format="json",
        )
        assert resp.status_code == 201
        group = Group.objects.get(name="MultiAppGroup")
        app_labels = set(
            group.permissions.values_list("content_type__app_label", flat=True).distinct()
        )
        assert "ipam" in app_labels
        assert "assets" in app_labels
        assert "contracts" in app_labels


# ---------------------------------------------------------------------------
# Update view
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestAppLevelGroupUpdateAuth:
    def test_unauthenticated_returns_401(self, anon_client, db):
        group = Group.objects.create(name="AuthUpdateGroup")
        resp = anon_client.put(update_url(group.pk), {"name": "X"}, format="json")
        assert resp.status_code == 401

    def test_non_superuser_returns_403(self, no_perm_client, db):
        group = Group.objects.create(name="NSuperUpdateGroup")
        resp = no_perm_client.put(update_url(group.pk), {"name": "X"}, format="json")
        assert resp.status_code == 403


@pytest.mark.django_db
class TestAppLevelGroupUpdate:
    def test_update_nonexistent_group_returns_404(self, superuser_client):
        resp = superuser_client.put(
            update_url(99999), {"name": "Ghost", "app_access_levels": []}, format="json"
        )
        assert resp.status_code == 404

    def test_update_group_name(self, superuser_client, db):
        group = Group.objects.create(name="OldAppGroup")
        resp = superuser_client.put(
            update_url(group.pk),
            {"name": "UpdatedAppGroup", "app_access_levels": []},
            format="json",
        )
        assert resp.status_code == 200
        group.refresh_from_db()
        assert group.name == "UpdatedAppGroup"

    def test_update_blank_name_returns_400(self, superuser_client, db):
        group = Group.objects.create(name="BlankNameGroup")
        resp = superuser_client.put(
            update_url(group.pk),
            {"name": "", "app_access_levels": []},
            format="json",
        )
        assert resp.status_code == 400

    def test_update_changes_permissions(self, superuser_client, db):
        group = Group.objects.create(name="ChangePermsGroup")
        resp = superuser_client.put(
            update_url(group.pk),
            {
                "name": "ChangePermsGroup",
                "app_access_levels": [{"app": "ipam", "level": "read"}],
            },
            format="json",
        )
        assert resp.status_code == 200
        group.refresh_from_db()
        ipam_perms = group.permissions.filter(content_type__app_label="ipam")
        assert ipam_perms.exists()

    def test_update_reuses_existing_bundle(self, superuser_client, db):
        """Second call with same app+level should reuse the auto-generated bundle."""
        PermissionBundle.objects.create(
            code="ipam_read_all",
            name="Ipam Read All",
            app="ipam",
        )
        group = Group.objects.create(name="ReuseBundle")
        count_before = PermissionBundle.objects.count()
        superuser_client.put(
            update_url(group.pk),
            {
                "name": "ReuseBundle",
                "app_access_levels": [{"app": "ipam", "level": "read"}],
            },
            format="json",
        )
        assert PermissionBundle.objects.count() == count_before

    def test_update_response_includes_bundle_ids(self, superuser_client, db):
        group = Group.objects.create(name="BundleIdResp")
        resp = superuser_client.put(
            update_url(group.pk),
            {
                "name": "BundleIdResp",
                "app_access_levels": [{"app": "contracts", "level": "read"}],
            },
            format="json",
        )
        assert resp.status_code == 200
        assert isinstance(resp.data.get("permission_bundle_ids"), list)
        assert len(resp.data["permission_bundle_ids"]) > 0

    def test_update_invalid_app_returns_400(self, superuser_client, db):
        group = Group.objects.create(name="InvalidAppUpdate")
        resp = superuser_client.put(
            update_url(group.pk),
            {"name": "InvalidAppUpdate", "app_access_levels": [{"app": "xxx", "level": "read"}]},
            format="json",
        )
        assert resp.status_code == 400
