"""
Tests for PermissionBundleViewSet at /api/v1/permission-bundles/ (core router).

Rules:
- Unauthenticated → 401
- Non-superuser list/retrieve → 200 empty (queryset is .none())
- Non-superuser create/update/delete → 403
- Superuser can perform full CRUD
- List uses lightweight serializer (no permissions_detail)
- Retrieve uses detail serializer (includes permissions_detail)
"""

import pytest
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType

from users.models import PermissionBundle

BUNDLES_URL = "/api/v1/permission-bundles/"


def bundle_detail_url(pk):
    return f"{BUNDLES_URL}{pk}/"


def _perm(codename, app_label="users", model="user"):
    ct, _ = ContentType.objects.get_or_create(app_label=app_label, model=model)
    p, _ = Permission.objects.get_or_create(
        codename=codename, content_type=ct, defaults={"name": f"Can {codename}"}
    )
    return p


def _bundle(code, name=None, app="users", perms=None):
    b = PermissionBundle.objects.create(code=code, name=name or code, app=app)
    if perms:
        b.permissions.set(perms)
    return b


# ---------------------------------------------------------------------------
# Authentication gate
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPermissionBundleViewSetAuth:
    def test_unauthenticated_list_returns_401(self, anon_client):
        resp = anon_client.get(BUNDLES_URL)
        assert resp.status_code == 401

    def test_unauthenticated_create_returns_401(self, anon_client):
        resp = anon_client.post(
            BUNDLES_URL, {"code": "anon_b", "name": "Anon Bundle"}, format="json"
        )
        assert resp.status_code == 401

    def test_unauthenticated_retrieve_returns_401(self, anon_client, db):
        b = _bundle("anon_detail_b")
        resp = anon_client.get(bundle_detail_url(b.pk))
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Non-superuser empty queryset
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPermissionBundleViewSetNonSuperuser:
    def test_list_returns_empty(self, no_perm_client, db):
        _bundle("hidden_b")
        resp = no_perm_client.get(BUNDLES_URL)
        assert resp.status_code == 200
        assert resp.data["results"] == []

    def test_retrieve_returns_404(self, no_perm_client, db):
        b = _bundle("hidden_b2")
        resp = no_perm_client.get(bundle_detail_url(b.pk))
        assert resp.status_code == 404

    def test_create_returns_403(self, no_perm_client):
        resp = no_perm_client.post(
            BUNDLES_URL, {"code": "nsup_b", "name": "Non-super bundle"}, format="json"
        )
        assert resp.status_code == 403

    def test_update_returns_403(self, no_perm_client, db):
        b = _bundle("upd_blocked_b")
        resp = no_perm_client.patch(bundle_detail_url(b.pk), {"name": "changed"}, format="json")
        assert resp.status_code in (403, 404)

    def test_delete_returns_403(self, no_perm_client, db):
        b = _bundle("del_blocked_b")
        resp = no_perm_client.delete(bundle_detail_url(b.pk))
        assert resp.status_code in (403, 404)

    def test_ipam_user_cannot_see_bundles(self, ipam_read_client, db):
        _bundle("ipam_hidden_b", app="ipam")
        resp = ipam_read_client.get(BUNDLES_URL)
        assert resp.status_code == 200
        assert resp.data["results"] == []


# ---------------------------------------------------------------------------
# Superuser full CRUD
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestPermissionBundleViewSetSuperuser:
    def test_list_returns_bundles(self, superuser_client, db):
        _bundle("list_b1")
        _bundle("list_b2")
        resp = superuser_client.get(BUNDLES_URL)
        assert resp.status_code == 200
        codes = [b["code"] for b in resp.data["results"]]
        assert "list_b1" in codes
        assert "list_b2" in codes

    def test_list_does_not_include_permissions_detail(self, superuser_client, db):
        perm = _perm("list_no_detail_perm")
        _bundle("list_no_detail_b", perms=[perm])
        resp = superuser_client.get(BUNDLES_URL)
        assert resp.status_code == 200
        first = next(b for b in resp.data["results"] if b["code"] == "list_no_detail_b")
        assert "permissions_detail" not in first

    def test_retrieve_includes_permissions_detail(self, superuser_client, db):
        perm = _perm("detail_perm_bundle")
        b = _bundle("detail_b", perms=[perm])
        resp = superuser_client.get(bundle_detail_url(b.pk))
        assert resp.status_code == 200
        assert "permissions_detail" in resp.data
        codenames = [p["codename"] for p in resp.data["permissions_detail"]]
        assert "detail_perm_bundle" in codenames

    def test_create_bundle(self, superuser_client):
        resp = superuser_client.post(
            BUNDLES_URL,
            {"code": "created_bundle", "name": "Created Bundle", "app": "ipam"},
            format="json",
        )
        assert resp.status_code == 201
        assert PermissionBundle.objects.filter(code="created_bundle").exists()

    def test_create_bundle_with_permissions(self, superuser_client, db):
        perm = _perm("new_bundle_perm")
        resp = superuser_client.post(
            BUNDLES_URL,
            {
                "code": "bundle_with_perms",
                "name": "Bundle With Perms",
                "permissions": [perm.pk],
            },
            format="json",
        )
        assert resp.status_code == 201
        b = PermissionBundle.objects.get(code="bundle_with_perms")
        assert b.permissions.filter(pk=perm.pk).exists()

    def test_create_duplicate_code_returns_400(self, superuser_client, db):
        _bundle("dup_code_b")
        resp = superuser_client.post(
            BUNDLES_URL, {"code": "dup_code_b", "name": "Dup"}, format="json"
        )
        assert resp.status_code == 400

    def test_partial_update_bundle_name(self, superuser_client, db):
        b = _bundle("patch_name_b")
        resp = superuser_client.patch(
            bundle_detail_url(b.pk), {"name": "Patched Name"}, format="json"
        )
        assert resp.status_code == 200
        b.refresh_from_db()
        assert b.name == "Patched Name"

    def test_full_update_bundle(self, superuser_client, db):
        b = _bundle("full_upd_b", app="ipam")
        resp = superuser_client.put(
            bundle_detail_url(b.pk),
            {"code": "full_upd_b", "name": "Updated Bundle", "app": "assets"},
            format="json",
        )
        assert resp.status_code == 200
        b.refresh_from_db()
        assert b.name == "Updated Bundle"
        assert b.app == "assets"

    def test_delete_bundle(self, superuser_client, db):
        b = _bundle("del_bundle_b")
        resp = superuser_client.delete(bundle_detail_url(b.pk))
        assert resp.status_code == 204
        assert not PermissionBundle.objects.filter(pk=b.pk).exists()

    def test_retrieve_nonexistent_returns_404(self, superuser_client):
        resp = superuser_client.get(bundle_detail_url(99999))
        assert resp.status_code == 404

    def test_list_ordered_by_app_then_code(self, superuser_client, db):
        _bundle("z_bundle", app="zzz")
        _bundle("a_bundle", app="aaa")
        resp = superuser_client.get(BUNDLES_URL)
        assert resp.status_code == 200
        results = resp.data["results"]
        codes = [r["code"] for r in results]
        assert codes.index("a_bundle") < codes.index("z_bundle")
