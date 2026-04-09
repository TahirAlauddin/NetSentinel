"""
URL resolution tests for RBAC endpoints.

Verifies that all RBAC-related URLs:
- resolve to the correct view / ViewSet action
- are accessible at the expected paths (both core and users namespaces)
- return correct HTTP methods (GET, POST, PUT, DELETE, PATCH)
- return correct status codes for authenticated vs unauthenticated requests

This acts as a contract test ensuring URL structure is not accidentally broken.
"""

import pytest
from django.contrib.auth.models import Group
from django.urls import reverse, resolve

from users.views import (
    GroupViewSet,
    PermissionBundleViewSet,
    PermissionViewSet,
    create_group_from_permission_bundles_view,
    current_user_permissions_view,
    update_group_from_permission_bundles_view,
    user_assignments_view,
    user_stats_view,
)


# ---------------------------------------------------------------------------
# URL Resolution (Django URL → view mapping)
# ---------------------------------------------------------------------------


class TestURLResolution:
    """Tests that URL patterns resolve to the correct views."""

    # --- Users namespace ---

    def test_users_groups_list_resolves(self):
        url = "/api/v1/users/groups/"
        match = resolve(url)
        assert match.func.cls is GroupViewSet

    def test_users_groups_detail_resolves(self):
        url = "/api/v1/users/groups/1/"
        match = resolve(url)
        assert match.func.cls is GroupViewSet

    def test_users_permissions_list_resolves(self):
        url = "/api/v1/users/permissions/"
        match = resolve(url)
        assert match.func.cls is PermissionViewSet

    def test_users_current_permissions_resolves(self):
        url = "/api/v1/users/current-permissions/"
        match = resolve(url)
        assert match.func is current_user_permissions_view

    def test_users_assignments_resolves(self):
        url = "/api/v1/users/42/assignments/"
        match = resolve(url)
        assert match.func is user_assignments_view

    def test_users_stats_resolves(self):
        url = "/api/v1/users/stats/"
        match = resolve(url)
        assert match.func is user_stats_view

    def test_users_app_level_create_resolves(self):
        url = "/api/v1/users/groups/app-level/"
        match = resolve(url)
        assert match.func is create_group_from_permission_bundles_view

    def test_users_app_level_update_resolves(self):
        url = "/api/v1/users/groups/5/app-level/"
        match = resolve(url)
        assert match.func is update_group_from_permission_bundles_view

    # --- Core namespace (aliases at /api/v1/) ---

    def test_core_groups_list_resolves(self):
        url = "/api/v1/groups/"
        match = resolve(url)
        assert match.func.cls is GroupViewSet

    def test_core_groups_detail_resolves(self):
        url = "/api/v1/groups/1/"
        match = resolve(url)
        assert match.func.cls is GroupViewSet

    def test_core_permissions_list_resolves(self):
        url = "/api/v1/permissions/"
        match = resolve(url)
        assert match.func.cls is PermissionViewSet

    def test_core_permission_bundles_list_resolves(self):
        url = "/api/v1/permission-bundles/"
        match = resolve(url)
        assert match.func.cls is PermissionBundleViewSet

    def test_core_permission_bundles_detail_resolves(self):
        url = "/api/v1/permission-bundles/1/"
        match = resolve(url)
        assert match.func.cls is PermissionBundleViewSet

    def test_core_app_level_create_resolves(self):
        url = "/api/v1/groups/app-level/"
        match = resolve(url)
        assert match.func is create_group_from_permission_bundles_view

    def test_core_app_level_update_resolves(self):
        url = "/api/v1/groups/3/app-level/"
        match = resolve(url)
        assert match.func is update_group_from_permission_bundles_view


# ---------------------------------------------------------------------------
# HTTP method enforcement (correct methods accepted / rejected)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestHTTPMethodEnforcement:
    """Smoke-test that each endpoint accepts (or rejects) the right HTTP verbs."""

    # Groups list — GET + POST
    def test_groups_list_get_allowed(self, superuser_client):
        resp = superuser_client.get("/api/v1/users/groups/")
        assert resp.status_code == 200

    def test_groups_list_post_allowed(self, superuser_client):
        resp = superuser_client.post(
            "/api/v1/users/groups/", {"name": "HTTPMethodGroup"}, format="json"
        )
        assert resp.status_code == 201

    def test_groups_list_delete_not_allowed(self, superuser_client):
        resp = superuser_client.delete("/api/v1/users/groups/")
        assert resp.status_code == 405

    def test_groups_list_put_not_allowed(self, superuser_client):
        resp = superuser_client.put("/api/v1/users/groups/")
        assert resp.status_code == 405

    # Groups detail — GET, PUT, PATCH, DELETE
    def test_groups_detail_patch_allowed(self, superuser_client, db):
        group = Group.objects.create(name="PatchGroup")
        resp = superuser_client.patch(
            f"/api/v1/users/groups/{group.pk}/", {"name": "Patched"}, format="json"
        )
        assert resp.status_code == 200

    def test_groups_detail_put_allowed(self, superuser_client, db):
        group = Group.objects.create(name="PutGroup")
        resp = superuser_client.put(
            f"/api/v1/users/groups/{group.pk}/",
            {"name": "PutUpdated", "permissions": []},
            format="json",
        )
        assert resp.status_code == 200

    def test_groups_detail_delete_allowed(self, superuser_client, db):
        group = Group.objects.create(name="DeleteGroup")
        resp = superuser_client.delete(f"/api/v1/users/groups/{group.pk}/")
        assert resp.status_code == 204

    # Permissions — read only
    def test_permissions_post_not_allowed(self, superuser_client):
        resp = superuser_client.post(
            "/api/v1/users/permissions/", {"name": "x"}, format="json"
        )
        assert resp.status_code == 405

    def test_permissions_delete_not_allowed(self, superuser_client):
        resp = superuser_client.delete("/api/v1/users/permissions/")
        assert resp.status_code == 405

    # App-level create — POST only
    def test_app_level_create_get_not_allowed(self, superuser_client):
        resp = superuser_client.get("/api/v1/users/groups/app-level/")
        assert resp.status_code == 405

    def test_app_level_create_delete_not_allowed(self, superuser_client):
        resp = superuser_client.delete("/api/v1/users/groups/app-level/")
        assert resp.status_code == 405

    # App-level update — PUT only
    def test_app_level_update_get_not_allowed(self, superuser_client, db):
        group = Group.objects.create(name="APLVPutGroup")
        resp = superuser_client.get(f"/api/v1/users/groups/{group.pk}/app-level/")
        assert resp.status_code == 405

    def test_app_level_update_post_not_allowed(self, superuser_client, db):
        group = Group.objects.create(name="APLVPostGroup")
        resp = superuser_client.post(f"/api/v1/users/groups/{group.pk}/app-level/")
        assert resp.status_code == 405

    # current-permissions — GET only
    def test_current_perms_post_not_allowed(self, no_perm_client):
        resp = no_perm_client.post("/api/v1/users/current-permissions/")
        assert resp.status_code == 405

    # assignments — GET + PUT
    def test_assignments_post_not_allowed(self, superuser_client, db):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        u = User.objects.create_user(username="asgn_meth_u", email="am@x.com", password="p")
        resp = superuser_client.post(f"/api/v1/users/{u.pk}/assignments/")
        assert resp.status_code == 405

    def test_assignments_delete_not_allowed(self, superuser_client, db):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        u = User.objects.create_user(username="asgn_del_u", email="ad@x.com", password="p")
        resp = superuser_client.delete(f"/api/v1/users/{u.pk}/assignments/")
        assert resp.status_code == 405


# ---------------------------------------------------------------------------
# Core alias routes (same ViewSets registered at /api/v1/)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestCoreAliasRoutes:
    """Ensure /api/v1/groups/, /api/v1/permissions/ and /api/v1/permission-bundles/ work."""

    def test_core_groups_list(self, superuser_client):
        resp = superuser_client.get("/api/v1/groups/")
        assert resp.status_code == 200

    def test_core_permissions_list(self, superuser_client):
        resp = superuser_client.get("/api/v1/permissions/")
        assert resp.status_code == 200

    def test_core_permission_bundles_list(self, superuser_client):
        resp = superuser_client.get("/api/v1/permission-bundles/")
        assert resp.status_code == 200

    def test_core_app_level_create(self, superuser_client):
        resp = superuser_client.post(
            "/api/v1/groups/app-level/",
            {"name": "CoreAliasGroup", "app_access_levels": []},
            format="json",
        )
        assert resp.status_code == 201

    def test_core_app_level_update(self, superuser_client, db):
        group = Group.objects.create(name="CoreAliasUpdateGroup")
        resp = superuser_client.put(
            f"/api/v1/groups/{group.pk}/app-level/",
            {"name": "CoreAliasUpdateGroup", "app_access_levels": []},
            format="json",
        )
        assert resp.status_code == 200

    def test_non_superuser_core_groups_returns_empty(self, no_perm_client):
        resp = no_perm_client.get("/api/v1/groups/")
        assert resp.status_code == 200
        assert resp.data["results"] == []

    def test_unauthenticated_core_groups_returns_401(self, anon_client):
        resp = anon_client.get("/api/v1/groups/")
        assert resp.status_code == 401
