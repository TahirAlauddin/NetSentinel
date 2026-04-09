"""
Tests for PermissionViewSet at /api/v1/users/permissions/ (read-only).

Rules:
- Unauthenticated → 401
- Authenticated non-superuser → 200 with empty list
- Superuser → 200 with full permission list
- Write operations (POST / PUT / PATCH / DELETE) → 405 (method not allowed)
- current_user_permissions_view → returns caller's effective permissions
"""

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType

from users.models import ExtendedGroup, PermissionBundle

User = get_user_model()

PERMISSIONS_URL = "/api/v1/users/permissions/"
CURRENT_PERMS_URL = "/api/v1/users/current-permissions/"


def _perm(codename, app_label="users", model="user"):
    ct, _ = ContentType.objects.get_or_create(app_label=app_label, model=model)
    p, _ = Permission.objects.get_or_create(
        codename=codename, content_type=ct, defaults={"name": f"Can {codename}"}
    )
    return p


# ---------------------------------------------------------------------------
# Authentication gate
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPermissionViewSetAuth:
    def test_unauthenticated_list_returns_401(self, anon_client):
        resp = anon_client.get(PERMISSIONS_URL)
        assert resp.status_code == 401

    def test_unauthenticated_retrieve_returns_401(self, anon_client, db):
        perm = _perm("anon_perm_test")
        resp = anon_client.get(f"{PERMISSIONS_URL}{perm.pk}/")
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Non-superuser: empty queryset
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPermissionViewSetNonSuperuser:
    def test_list_returns_200_empty(self, no_perm_client):
        resp = no_perm_client.get(PERMISSIONS_URL)
        assert resp.status_code == 200
        assert resp.data["results"] == []

    def test_retrieve_returns_404_because_empty_queryset(self, no_perm_client, db):
        perm = _perm("hidden_perm")
        resp = no_perm_client.get(f"{PERMISSIONS_URL}{perm.pk}/")
        assert resp.status_code == 404

    def test_ipam_scoped_user_sees_empty_permissions(self, ipam_read_client):
        resp = ipam_read_client.get(PERMISSIONS_URL)
        assert resp.status_code == 200
        assert resp.data["results"] == []

    def test_assets_scoped_user_sees_empty_permissions(self, assets_admin_client):
        resp = assets_admin_client.get(PERMISSIONS_URL)
        assert resp.status_code == 200
        assert resp.data["results"] == []


# ---------------------------------------------------------------------------
# Superuser: full access
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPermissionViewSetSuperuser:
    def test_list_returns_permissions(self, superuser_client):
        resp = superuser_client.get(PERMISSIONS_URL)
        assert resp.status_code == 200
        assert resp.data["count"] > 0

    def test_retrieve_returns_permission_detail(self, superuser_client, db):
        perm = _perm("su_retrieve_perm")
        resp = superuser_client.get(f"{PERMISSIONS_URL}{perm.pk}/")
        assert resp.status_code == 200
        assert resp.data["codename"] == "su_retrieve_perm"

    def test_list_permission_fields(self, superuser_client, db):
        _perm("field_check_perm")
        resp = superuser_client.get(PERMISSIONS_URL)
        assert resp.status_code == 200
        first = resp.data["results"][0]
        assert "id" in first
        assert "name" in first
        assert "codename" in first
        assert "content_type" in first


# ---------------------------------------------------------------------------
# Read-only enforcement (405 on writes)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPermissionViewSetReadOnly:
    def test_post_not_allowed(self, superuser_client):
        resp = superuser_client.post(
            PERMISSIONS_URL, {"codename": "cant_create", "name": "x"}, format="json"
        )
        assert resp.status_code == 405

    def test_put_not_allowed(self, superuser_client, db):
        perm = _perm("cant_put_perm")
        resp = superuser_client.put(
            f"{PERMISSIONS_URL}{perm.pk}/",
            {"codename": "changed", "name": "x"},
            format="json",
        )
        assert resp.status_code == 405

    def test_delete_not_allowed(self, superuser_client, db):
        perm = _perm("cant_delete_perm")
        resp = superuser_client.delete(f"{PERMISSIONS_URL}{perm.pk}/")
        assert resp.status_code == 405


# ---------------------------------------------------------------------------
# current_user_permissions_view
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestCurrentUserPermissionsView:
    def test_unauthenticated_returns_401(self, anon_client):
        resp = anon_client.get(CURRENT_PERMS_URL)
        assert resp.status_code == 401

    def test_user_with_no_perms_returns_empty_list(self, no_perm_client):
        resp = no_perm_client.get(CURRENT_PERMS_URL)
        assert resp.status_code == 200
        assert resp.data["permissions"] == []

    def test_direct_user_permission_appears(self, db, make_user, make_jwt_client):
        perm = _perm("direct_view_perm")
        user = make_user()
        user.user_permissions.add(perm)
        client = make_jwt_client(user)
        resp = client.get(CURRENT_PERMS_URL)
        assert resp.status_code == 200
        assert "users.direct_view_perm" in resp.data["permissions"]

    def test_bundle_permission_appears_via_group(self, db, make_user, make_jwt_client):
        perm = _perm("bundle_visible_perm")
        bundle = PermissionBundle.objects.create(code="vis_bundle", name="Vis Bundle", app="users")
        bundle.permissions.add(perm)
        group = Group.objects.create(name="VisGroup")
        ext = ExtendedGroup.objects.create(group=group)
        ext.bundles.add(bundle)
        user = make_user(groups=[group])
        client = make_jwt_client(user)
        resp = client.get(CURRENT_PERMS_URL)
        assert resp.status_code == 200
        assert "users.bundle_visible_perm" in resp.data["permissions"]

    def test_permissions_are_sorted(self, db, make_user, make_jwt_client):
        p1 = _perm("zzz_last_perm")
        p2 = _perm("aaa_first_perm")
        user = make_user()
        user.user_permissions.set([p1, p2])
        client = make_jwt_client(user)
        resp = client.get(CURRENT_PERMS_URL)
        assert resp.status_code == 200
        perms = resp.data["permissions"]
        # Response should be sorted alphabetically
        assert perms == sorted(perms)

    def test_ipam_user_sees_only_ipam_perms(self, ipam_read_client, ipam_read_user):
        resp = ipam_read_client.get(CURRENT_PERMS_URL)
        assert resp.status_code == 200
        perms = resp.data["permissions"]
        # All perms should be ipam.view_* — no assets or contracts perms
        for p in perms:
            assert p.startswith("ipam.")
        assert any(p.startswith("ipam.view_") for p in perms)

    def test_assets_user_does_not_see_ipam_perms(self, assets_read_client):
        resp = assets_read_client.get(CURRENT_PERMS_URL)
        assert resp.status_code == 200
        perms = resp.data["permissions"]
        assert not any(p.startswith("ipam.") for p in perms)
        assert any(p.startswith("assets.") for p in perms)

    def test_superuser_has_all_permissions(self, superuser_client):
        resp = superuser_client.get(CURRENT_PERMS_URL)
        assert resp.status_code == 200
        perms = resp.data["permissions"]
        # Superuser should see many permissions across all apps
        apps = {p.split(".")[0] for p in perms}
        assert "ipam" in apps or "assets" in apps  # has at least some perms
