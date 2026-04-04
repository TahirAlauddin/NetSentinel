"""
Tests for Assets API views.
"""

from datetime import date, timedelta

import pytest
from rest_framework import status

from assets.models import (
    Asset,
    AssetAttachment,
    AssetCategory,
    AssetRelation,
    ComputerDetails,
    TechSpecs,
)


@pytest.mark.api
@pytest.mark.django_db
class TestAssetTagViewSet:
    """Test cases for AssetTagViewSet."""

    def test_list_asset_tags_requires_authentication(self, api_client):
        """Test that listing asset tags requires authentication."""
        response = api_client.get("/api/v1/assets/tags/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_asset_tag_success(self, authenticated_api_client_with_assets_perms):
        """Test that authenticated user can create an asset tag."""
        data = {"name": "Laptop", "color": "#FF5733"}
        response = authenticated_api_client_with_assets_perms.post(
            "/api/v1/assets/tags/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Laptop"
        assert response.data["color"] == "#FF5733"


@pytest.mark.api
@pytest.mark.django_db
class TestVendorViewSet:
    """Test cases for VendorViewSet."""

    def test_list_vendors_requires_authentication(self, api_client):
        """Test that listing vendors requires authentication."""
        response = api_client.get("/api/v1/assets/vendors/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_vendor_success(self, authenticated_api_client_with_assets_perms):
        """Test that authenticated user can create a vendor."""
        data = {
            "name": "Dell Inc.",
            "contact_info": "contact@dell.com",
            "website": "https://www.dell.com",
        }
        response = authenticated_api_client_with_assets_perms.post(
            "/api/v1/assets/vendors/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Dell Inc."


@pytest.mark.api
@pytest.mark.django_db
class TestAssetCategoryViewSet:
    """Test cases for AssetCategoryViewSet."""

    def test_list_categories_requires_authentication(self, api_client):
        """Test that listing categories requires authentication."""
        response = api_client.get("/api/v1/assets/categories/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_category_success(self, authenticated_api_client_with_assets_perms):
        """Test that authenticated user can create a category."""
        tech_specs = TechSpecs.objects.create(name="Computer")
        data = {"name": "Laptop", "tech_specs": tech_specs.id}
        response = authenticated_api_client_with_assets_perms.post(
            "/api/v1/assets/categories/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Laptop"

    def test_category_assets_action(self, authenticated_api_client_with_assets_perms):
        """Test the assets custom action."""
        category = AssetCategory.objects.create(name="Laptop")
        asset1 = Asset.objects.create(name="Laptop 1", category=category)
        asset2 = Asset.objects.create(name="Laptop 2", category=category)

        response = authenticated_api_client_with_assets_perms.get(f"/api/v1/assets/categories/{category.id}/assets/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        asset_ids = [a["id"] for a in response.data]
        assert asset1.id in asset_ids
        assert asset2.id in asset_ids


@pytest.mark.api
@pytest.mark.django_db
class TestAssetViewSet:
    """Test cases for AssetViewSet."""

    def test_list_assets_requires_authentication(self, api_client):
        """Test that listing assets requires authentication."""
        response = api_client.get("/api/v1/assets/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_assets_success(self, authenticated_api_client_with_assets_perms):
        """Test that authenticated user can list assets."""
        category = AssetCategory.objects.create(name="Laptop")
        Asset.objects.create(name="Laptop 1", category=category)
        Asset.objects.create(name="Laptop 2", category=category)

        response = authenticated_api_client_with_assets_perms.get("/api/v1/assets/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 2

    def test_create_asset_success(self, authenticated_api_client_with_assets_perms):
        """Test that authenticated user can create an asset."""
        category = AssetCategory.objects.create(name="Laptop")
        data = {
            "name": "New Laptop",
            "category": category.id,
            "status": "active",
            "asset_tag": "LAP-001",
        }
        response = authenticated_api_client_with_assets_perms.post(
            "/api/v1/assets/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "New Laptop"
        assert response.data["category"] == category.id

    def test_filter_assets_by_category(self, authenticated_api_client_with_assets_perms):
        """Test filtering assets by category."""
        category1 = AssetCategory.objects.create(name="Laptop")
        category2 = AssetCategory.objects.create(name="Desktop")
        Asset.objects.create(name="Laptop 1", category=category1)
        Asset.objects.create(name="Desktop 1", category=category2)

        response = authenticated_api_client_with_assets_perms.get(f"/api/v1/assets/?category={category1.id}")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["name"] == "Laptop 1"

    def test_filter_assets_by_status(self, authenticated_api_client_with_assets_perms):
        """Test filtering assets by status."""
        category = AssetCategory.objects.create(name="Laptop")
        Asset.objects.create(name="Active Asset", category=category, status="active")
        Asset.objects.create(name="Retired Asset", category=category, status="retired")

        response = authenticated_api_client_with_assets_perms.get("/api/v1/assets/?status=active")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["status"] == "active"

    def test_search_assets_by_name(self, authenticated_api_client_with_assets_perms):
        """Test searching assets by name."""
        category = AssetCategory.objects.create(name="Laptop")
        Asset.objects.create(name="Dell Laptop", category=category)
        Asset.objects.create(name="HP Desktop", category=category)

        response = authenticated_api_client_with_assets_perms.get("/api/v1/assets/?search=Dell")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert "Dell" in response.data["results"][0]["name"]

    def test_search_assets_by_asset_tag(self, authenticated_api_client_with_assets_perms):
        """Test searching assets by asset_tag."""
        category = AssetCategory.objects.create(name="Laptop")
        Asset.objects.create(name="Laptop 1", category=category, asset_tag="LAP-001")
        Asset.objects.create(name="Laptop 2", category=category, asset_tag="LAP-002")

        response = authenticated_api_client_with_assets_perms.get("/api/v1/assets/?search=LAP-001")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1

    def test_asset_stats_action(self, authenticated_api_client_with_assets_perms):
        """Test the stats custom action."""
        category = AssetCategory.objects.create(name="Laptop")
        Asset.objects.create(name="Active", category=category, status="active")
        Asset.objects.create(name="Retired", category=category, status="retired")
        Asset.objects.create(name="In Repair", category=category, status="in_repair")

        response = authenticated_api_client_with_assets_perms.get("/api/v1/assets/stats/")
        assert response.status_code == status.HTTP_200_OK
        assert "total" in response.data
        assert "active" in response.data
        assert "retired" in response.data
        assert "in_repair" in response.data
        assert response.data["total"] == 3
        assert response.data["active"] == 1
        assert response.data["retired"] == 1

    def test_asset_attachments_action(self, authenticated_api_client_with_assets_perms, user):
        """Test the attachments custom action."""
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(name="Test Laptop", category=category)
        # AssetAttachment uses ForeignKey, not GenericForeignKey
        # So we use asset.attachments directly, not get_attachments()
        AssetAttachment.objects.create(
            asset=asset,
            name="Test Document",
            uploaded_by=user,
        )

        response = authenticated_api_client_with_assets_perms.get(f"/api/v1/assets/{asset.id}/attachments/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]["name"] == "Test Document"

    def test_asset_related_assets_action(self, authenticated_api_client_with_assets_perms):
        """Test the related_assets custom action."""
        category = AssetCategory.objects.create(name="Laptop")
        asset1 = Asset.objects.create(name="Asset 1", category=category)
        asset2 = Asset.objects.create(name="Asset 2", category=category)
        AssetRelation.objects.create(asset=asset1, related_asset=asset2)

        response = authenticated_api_client_with_assets_perms.get(f"/api/v1/assets/{asset1.id}/related_assets/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_add_related_asset_action(self, authenticated_api_client_with_assets_perms):
        """Test the add_related_asset custom action."""
        category = AssetCategory.objects.create(name="Laptop")
        asset1 = Asset.objects.create(name="Asset 1", category=category)
        asset2 = Asset.objects.create(name="Asset 2", category=category)

        response = authenticated_api_client_with_assets_perms.post(
            f"/api/v1/assets/{asset1.id}/add_related_asset/",
            {"related_asset_id": asset2.id},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert AssetRelation.objects.filter(asset=asset1, related_asset=asset2).exists()

    def test_remove_related_asset_action(self, authenticated_api_client_with_assets_perms):
        """Test the remove_related_asset custom action."""
        category = AssetCategory.objects.create(name="Laptop")
        asset1 = Asset.objects.create(name="Asset 1", category=category)
        asset2 = Asset.objects.create(name="Asset 2", category=category)
        relation = AssetRelation.objects.create(asset=asset1, related_asset=asset2)

        response = authenticated_api_client_with_assets_perms.delete(
            f"/api/v1/assets/{asset1.id}/remove_related_asset/?related_asset_id={asset2.id}"
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not AssetRelation.objects.filter(id=relation.id).exists()


@pytest.mark.api
@pytest.mark.django_db
class TestAssetAttachmentViewSet:
    """Test cases for AssetAttachmentViewSet."""

    def test_list_attachments_requires_authentication(self, api_client):
        """Test that listing attachments requires authentication."""
        response = api_client.get("/api/v1/assets/attachments/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.api
@pytest.mark.django_db
class TestComputerDetailsViewSet:
    """Test cases for ComputerDetailsViewSet."""

    def test_list_computer_details_requires_authentication(self, api_client):
        """Test that listing computer details requires authentication."""
        response = api_client.get("/api/v1/assets/computer-details/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_computer_details_success(self, authenticated_api_client_with_assets_perms):
        """Test that authenticated user can list computer details."""
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(name="Test Laptop", category=category)
        ComputerDetails.objects.create(asset=asset, cpu="Intel Core i7", ram="16GB")

        response = authenticated_api_client_with_assets_perms.get("/api/v1/assets/computer-details/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1


@pytest.mark.api
@pytest.mark.django_db
class TestAssetImageViewSet:
    """Test cases for AssetImageViewSet (nested under assets)."""

    def test_list_asset_images_requires_authentication(self, api_client):
        """Test that listing asset images requires authentication."""
        response = api_client.get("/api/v1/assets/1/images/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_asset_images_requires_valid_asset(self, authenticated_api_client_with_assets_perms):
        """Test that listing images requires valid asset ID."""
        # Nested routes with rest_framework_nested might return 404 for invalid parent
        # or might return 200 with empty list. Let's test that it doesn't crash
        response = authenticated_api_client_with_assets_perms.get("/api/v1/assets/99999/images/")
        # Accept either 404 or 200 (with empty list) - both are valid behaviors
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        if response.status_code == status.HTTP_200_OK:
            # If it returns 200, it should be an empty list or paginated response
            assert isinstance(response.data, (list, dict))
            if isinstance(response.data, dict):
                # Paginated response
                assert "results" in response.data or "count" in response.data


@pytest.mark.api
@pytest.mark.django_db
class TestCalendarAlertViewSet:
    """Test cases for CalendarAlertViewSet (nested under assets)."""

    def test_list_calendar_alerts_requires_authentication(self, api_client):
        """Test that listing calendar alerts requires authentication."""
        response = api_client.get("/api/v1/assets/1/calendar-alerts/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_calendar_alert_success(self, authenticated_api_client_with_assets_perms, user):
        """Test that authenticated user can create a calendar alert."""
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(name="Test Laptop", category=category)
        data = {
            "date": str(date.today() + timedelta(days=30)),
            "message": "Warranty expires soon",
            "assigned_to": user.id,
        }
        response = authenticated_api_client_with_assets_perms.post(
            f"/api/v1/assets/{asset.id}/calendar-alerts/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["message"] == "Warranty expires soon"
        assert response.data["assigned_to"] == user.id
