"""
Cross-app permission isolation tests.

Core assertion: a user whose bundle permissions are scoped to one app
should NOT be able to perform operations on another app's resources.

Permission enforcement model:
- Assets: DjangoModelPermissions (hard enforcement – no perm = 403)
- IPAM, Contracts, Infrastructure: IsAuthenticated only (any authed user can read;
  the isolation we test here is at the has_perm() / bundle level, not HTTP 403)
- The current-permissions endpoint precisely reflects what each user can see.

Tests are grouped by the "attacker" app (the user) and the "target" app.
"""

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission

from users.models import ExtendedGroup, PermissionBundle

User = get_user_model()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

ASSETS_TAGS_URL = "/api/v1/assets/tags/"
ASSETS_VENDORS_URL = "/api/v1/assets/vendors/"
ASSETS_CATEGORIES_URL = "/api/v1/assets/categories/"
IPAM_SUBNETS_URL = "/api/v1/ipam/subnets/"
IPAM_VLANS_URL = "/api/v1/ipam/vlans/"
CONTRACTS_URL = "/api/v1/contracts/"
CURRENT_PERMS_URL = "/api/v1/users/current-permissions/"


def _perms_for_app(app_label, prefix="view_"):
    return list(
        Permission.objects.filter(content_type__app_label=app_label, codename__startswith=prefix)
    )


# ---------------------------------------------------------------------------
# has_perm() isolation (backend-level, independent of HTTP)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestHasPermIsolation:
    """Verify has_perm() only reflects the bundle(s) assigned to each user."""

    def test_ipam_user_has_ipam_view_perms(self, ipam_read_user):
        perms = ipam_read_user.get_all_permissions()
        assert any(p.startswith("ipam.") for p in perms)

    def test_ipam_user_has_no_assets_perms(self, ipam_read_user):
        perms = ipam_read_user.get_all_permissions()
        assert not any(p.startswith("assets.") for p in perms)

    def test_ipam_user_has_no_contracts_perms(self, ipam_read_user):
        perms = ipam_read_user.get_all_permissions()
        assert not any(p.startswith("contracts.") for p in perms)

    def test_assets_user_has_assets_perms(self, assets_read_user):
        perms = assets_read_user.get_all_permissions()
        assert any(p.startswith("assets.") for p in perms)

    def test_assets_user_has_no_ipam_perms(self, assets_read_user):
        perms = assets_read_user.get_all_permissions()
        assert not any(p.startswith("ipam.") for p in perms)

    def test_assets_user_has_no_contracts_perms(self, assets_read_user):
        perms = assets_read_user.get_all_permissions()
        assert not any(p.startswith("contracts.") for p in perms)

    def test_contracts_user_has_contracts_perms(self, contracts_read_user):
        perms = contracts_read_user.get_all_permissions()
        assert any(p.startswith("contracts.") for p in perms)

    def test_contracts_user_has_no_ipam_perms(self, contracts_read_user):
        perms = contracts_read_user.get_all_permissions()
        assert not any(p.startswith("ipam.") for p in perms)

    def test_contracts_user_has_no_assets_perms(self, contracts_read_user):
        perms = contracts_read_user.get_all_permissions()
        assert not any(p.startswith("assets.") for p in perms)

    def test_no_perm_user_has_no_app_perms(self, no_perm_user):
        perms = no_perm_user.get_all_permissions()
        assert not any(p.startswith(("ipam.", "assets.", "contracts.")) for p in perms)

    def test_ipam_admin_user_has_full_ipam_perms(self, ipam_admin_user):
        for prefix in ("view_", "add_", "change_", "delete_"):
            assert ipam_admin_user.has_perm(
                next(
                    p
                    for p in ipam_admin_user.get_all_permissions()
                    if p.startswith(f"ipam.{prefix}")
                )
            ), f"Expected ipam.{prefix}* perm"

    def test_ipam_admin_user_has_no_assets_write_perms(self, ipam_admin_user):
        perms = ipam_admin_user.get_all_permissions()
        assert not any(p.startswith("assets.add_") for p in perms)
        assert not any(p.startswith("assets.change_") for p in perms)
        assert not any(p.startswith("assets.delete_") for p in perms)


# ---------------------------------------------------------------------------
# HTTP API isolation: Assets (DjangoModelPermissions)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestAssetsAPIIsolation:
    """
    Assets ViewSets use DjangoModelPermissions, so permission checks are enforced
    at the HTTP layer. Users without the correct model perms get 403.
    """

    def test_assets_read_user_can_list_tags(self, assets_read_client):
        resp = assets_read_client.get(ASSETS_TAGS_URL)
        assert resp.status_code == 200

    def test_assets_read_user_can_list_vendors(self, assets_read_client):
        resp = assets_read_client.get(ASSETS_VENDORS_URL)
        assert resp.status_code == 200

    def test_assets_read_user_cannot_create_tag(self, assets_read_client):
        resp = assets_read_client.post(ASSETS_TAGS_URL, {"name": "NewTag"}, format="json")
        assert resp.status_code == 403

    def test_assets_admin_user_can_create_tag(self, assets_admin_client):
        resp = assets_admin_client.post(ASSETS_TAGS_URL, {"name": "AdminTag"}, format="json")
        assert resp.status_code == 201

    def test_ipam_only_user_cannot_list_asset_tags(self, ipam_read_client):
        """IPAM user has no assets permissions → DjangoModelPermissions returns 403."""
        resp = ipam_read_client.get(ASSETS_TAGS_URL)
        assert resp.status_code == 403

    def test_ipam_admin_user_cannot_list_asset_tags(self, ipam_admin_client):
        resp = ipam_admin_client.get(ASSETS_TAGS_URL)
        assert resp.status_code == 403

    def test_ipam_user_cannot_create_asset_tag(self, ipam_read_client):
        resp = ipam_read_client.post(ASSETS_TAGS_URL, {"name": "IPAMTag"}, format="json")
        assert resp.status_code == 403

    def test_contracts_user_cannot_list_asset_tags(self, contracts_read_client):
        resp = contracts_read_client.get(ASSETS_TAGS_URL)
        assert resp.status_code == 403

    def test_contracts_user_cannot_create_asset_vendor(self, contracts_read_client):
        resp = contracts_read_client.post(
            ASSETS_VENDORS_URL, {"name": "ContractVendor"}, format="json"
        )
        assert resp.status_code == 403

    def test_no_perm_user_cannot_list_asset_tags(self, no_perm_client):
        resp = no_perm_client.get(ASSETS_TAGS_URL)
        assert resp.status_code == 403

    def test_unauthenticated_cannot_list_asset_tags(self, anon_client):
        resp = anon_client.get(ASSETS_TAGS_URL)
        assert resp.status_code == 401

    def test_assets_admin_user_can_list_categories(self, assets_admin_client):
        resp = assets_admin_client.get(ASSETS_CATEGORIES_URL)
        assert resp.status_code == 200

    def test_ipam_user_cannot_access_asset_categories(self, ipam_read_client):
        resp = ipam_read_client.get(ASSETS_CATEGORIES_URL)
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# HTTP API isolation: IPAM (IsAuthenticated only)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestIPAMAPIIsolation:
    """
    IPAM uses default IsAuthenticated. Any authenticated user can access it at
    the HTTP layer. The isolation tested here is at the bundle/has_perm level.
    """

    def test_ipam_user_can_list_subnets(self, ipam_read_client):
        resp = ipam_read_client.get(IPAM_SUBNETS_URL)
        assert resp.status_code == 200

    def test_assets_user_can_also_list_subnets(self, assets_read_client):
        """IPAM is auth-gated only — assets user can still list."""
        resp = assets_read_client.get(IPAM_SUBNETS_URL)
        assert resp.status_code == 200

    def test_no_perm_user_can_list_subnets(self, no_perm_client):
        """IsAuthenticated only — anyone authenticated can list."""
        resp = no_perm_client.get(IPAM_SUBNETS_URL)
        assert resp.status_code == 200

    def test_unauthenticated_cannot_list_subnets(self, anon_client):
        resp = anon_client.get(IPAM_SUBNETS_URL)
        assert resp.status_code == 401

    def test_ipam_user_vlans_accessible(self, ipam_read_client):
        resp = ipam_read_client.get(IPAM_VLANS_URL)
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# current-permissions endpoint isolation
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestCurrentPermissionsIsolation:
    """
    The /current-permissions/ endpoint precisely reflects each user's effective perms.
    Cross-app bleed would show up here as unexpected app prefixes.
    """

    def test_ipam_read_user_perms_are_only_ipam(self, ipam_read_client):
        resp = ipam_read_client.get(CURRENT_PERMS_URL)
        assert resp.status_code == 200
        perms = resp.data["permissions"]
        assert all(
            p.startswith("ipam.") for p in perms
        ), f"Non-ipam perms found: {[p for p in perms if not p.startswith('ipam.')]}"

    def test_assets_read_user_perms_are_only_assets(self, assets_read_client):
        resp = assets_read_client.get(CURRENT_PERMS_URL)
        assert resp.status_code == 200
        perms = resp.data["permissions"]
        assert all(
            p.startswith("assets.") for p in perms
        ), f"Non-assets perms found: {[p for p in perms if not p.startswith('assets.')]}"

    def test_contracts_read_user_perms_are_only_contracts(self, contracts_read_client):
        resp = contracts_read_client.get(CURRENT_PERMS_URL)
        assert resp.status_code == 200
        perms = resp.data["permissions"]
        assert all(
            p.startswith("contracts.") for p in perms
        ), f"Non-contracts perms found: {[p for p in perms if not p.startswith('contracts.')]}"

    def test_no_perm_user_has_empty_permissions(self, no_perm_client):
        resp = no_perm_client.get(CURRENT_PERMS_URL)
        assert resp.status_code == 200
        assert resp.data["permissions"] == []

    def test_ipam_admin_perms_include_write_ops(self, ipam_admin_client):
        resp = ipam_admin_client.get(CURRENT_PERMS_URL)
        assert resp.status_code == 200
        perms = resp.data["permissions"]
        codenames = [p.split(".", 1)[1] for p in perms if p.startswith("ipam.")]
        assert any(c.startswith("add_") for c in codenames)
        assert any(c.startswith("change_") for c in codenames)
        assert any(c.startswith("delete_") for c in codenames)

    def test_assets_read_perms_are_view_only(self, assets_read_client):
        resp = assets_read_client.get(CURRENT_PERMS_URL)
        assert resp.status_code == 200
        perms = resp.data["permissions"]
        codenames = [p.split(".", 1)[1] for p in perms if p.startswith("assets.")]
        assert all(
            c.startswith("view_") for c in codenames
        ), f"Non-view_ assets codenames: {[c for c in codenames if not c.startswith('view_')]}"


# ---------------------------------------------------------------------------
# Cross-user bleed: two different users, different app bundles
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestCrossUserPermissionBleed:
    """Ensure one user's bundle assignment never leaks into another user's perm set."""

    def test_ipam_user_and_assets_user_have_disjoint_perms(self, ipam_read_user, assets_read_user):
        ipam_perms = ipam_read_user.get_all_permissions()
        assets_perms = assets_read_user.get_all_permissions()
        overlap = ipam_perms & assets_perms
        # There should be zero overlap (ipam.* vs assets.*)
        assert overlap == set(), f"Unexpected perm overlap: {overlap}"

    def test_adding_bundle_to_one_user_does_not_affect_other(self, db, make_user, make_jwt_client):
        perm_a = Permission.objects.filter(content_type__app_label="ipam").first()
        perm_b = Permission.objects.filter(content_type__app_label="assets").first()
        if not perm_a or not perm_b:
            pytest.skip("Insufficient permissions in DB for this test")

        user_a = make_user(username="bleed_a")
        user_b = make_user(username="bleed_b")

        bundle = PermissionBundle.objects.create(code="bleed_bundle", name="Bleed Bundle")
        bundle.permissions.add(perm_a)
        group = Group.objects.create(name="BleedGroup")
        ext = ExtendedGroup.objects.create(group=group)
        ext.bundles.add(bundle)
        user_a.groups.add(group)

        assert user_a.has_perm(f"ipam.{perm_a.codename}")
        assert not user_b.has_perm(f"ipam.{perm_a.codename}")

    def test_removing_group_removes_bundle_perms(self, db, make_user):
        perm = Permission.objects.filter(content_type__app_label="ipam").first()
        if not perm:
            pytest.skip("No ipam permissions in DB")

        bundle = PermissionBundle.objects.create(code="remove_test_b", name="Remove Test")
        bundle.permissions.add(perm)
        group = Group.objects.create(name="RemoveGroup")
        ext = ExtendedGroup.objects.create(group=group)
        ext.bundles.add(bundle)

        user = make_user(username="remove_test_u", groups=[group])
        assert user.has_perm(f"ipam.{perm.codename}")

        user.groups.remove(group)
        user = User.objects.get(pk=user.pk)
        assert not user.has_perm(f"ipam.{perm.codename}")


# ---------------------------------------------------------------------------
# Bundle-scoped assets write permission tests
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestAssetsBundleWritePermissions:
    """Test that bundle-granted permissions correctly gate write operations."""

    def test_assets_admin_via_bundle_can_create_tag(self, assets_admin_client):
        resp = assets_admin_client.post(ASSETS_TAGS_URL, {"name": "BundleTag"}, format="json")
        assert resp.status_code == 201

    def test_assets_read_via_bundle_blocked_from_creating_tag(self, assets_read_client):
        resp = assets_read_client.post(ASSETS_TAGS_URL, {"name": "ReadOnlyTag"}, format="json")
        assert resp.status_code == 403

    def test_assets_edit_via_bundle_can_create_vendor(self, db, make_user, make_jwt_client):
        """User with assets edit bundle (view_ + change_) should be blocked from add_."""
        perms = list(
            Permission.objects.filter(
                content_type__app_label="assets",
                codename__in=["view_vendor", "change_vendor"],
            )
        )
        bundle = PermissionBundle.objects.create(
            code="assets_edit_vendor", name="Assets Edit Vendor", app="assets"
        )
        bundle.permissions.set(perms)
        group = Group.objects.create(name="AssetsEditVendorGroup")
        ext = ExtendedGroup.objects.create(group=group)
        ext.bundles.add(bundle)
        user = make_user(username="edit_vendor_user", groups=[group])
        client = make_jwt_client(user)
        # POST requires add_vendor — not included in edit bundle
        resp = client.post(ASSETS_VENDORS_URL, {"name": "NoAddVendor"}, format="json")
        assert resp.status_code == 403
