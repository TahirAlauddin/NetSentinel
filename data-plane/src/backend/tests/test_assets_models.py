"""
Tests for Asset models.
"""

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from datetime import date, timedelta
from assets.models import (
    AssetTag,
    CustomLifecycle,
    Vendor,
    TechSpecs,
    AssetCategory,
    Asset,
    AssetAttachment,
    AssetRelation,
    CalendarAlert,
    ComputerDetails,
    NetworkDetails,
)
from infrastructure.models import Location, Department


@pytest.mark.django_db
class TestAssetTagModel:
    """Test cases for AssetTag model."""

    def test_asset_tag_creation(self):
        """Test that an asset tag can be created."""
        tag = AssetTag.objects.create(name="Laptop", color="#FF5733")
        assert tag.name == "Laptop"
        assert tag.color == "#FF5733"

    def test_asset_tag_str_representation(self):
        """Test asset tag string representation."""
        tag = AssetTag.objects.create(name="Laptop")
        assert str(tag) == "Laptop"

    def test_asset_tag_unique_name(self):
        """Test that asset tag name must be unique."""
        AssetTag.objects.create(name="Laptop")
        with pytest.raises(IntegrityError):
            AssetTag.objects.create(name="Laptop")

    def test_asset_tag_optional_color(self):
        """Test that color is optional."""
        tag = AssetTag.objects.create(name="Laptop")
        assert tag.color is None


@pytest.mark.django_db
class TestCustomLifecycleModel:
    """Test cases for CustomLifecycle model."""

    def test_custom_lifecycle_creation(self):
        """Test that a custom lifecycle can be created."""
        lifecycle = CustomLifecycle.objects.create(
            name="Standard Lifecycle",
            description="Standard asset lifecycle",
        )
        assert lifecycle.name == "Standard Lifecycle"
        assert lifecycle.description == "Standard asset lifecycle"

    def test_custom_lifecycle_str_representation(self):
        """Test custom lifecycle string representation."""
        lifecycle = CustomLifecycle.objects.create(name="Standard Lifecycle")
        assert str(lifecycle) == "Standard Lifecycle"


@pytest.mark.django_db
class TestVendorModel:
    """Test cases for Vendor model."""

    def test_vendor_creation(self):
        """Test that a vendor can be created."""
        vendor = Vendor.objects.create(
            name="Dell Inc.",
            contact_info="contact@dell.com",
            website="https://www.dell.com",
        )
        assert vendor.name == "Dell Inc."
        assert vendor.contact_info == "contact@dell.com"
        assert vendor.website == "https://www.dell.com"

    def test_vendor_str_representation(self):
        """Test vendor string representation."""
        vendor = Vendor.objects.create(name="Dell Inc.")
        assert str(vendor) == "Dell Inc."

    def test_vendor_unique_name(self):
        """Test that vendor name must be unique."""
        Vendor.objects.create(name="Dell Inc.")
        with pytest.raises(IntegrityError):
            Vendor.objects.create(name="Dell Inc.")


@pytest.mark.django_db
class TestTechSpecsModel:
    """Test cases for TechSpecs model."""

    def test_tech_specs_creation(self):
        """Test that tech specs can be created."""
        tech_specs = TechSpecs.objects.create(name="Computer")
        assert tech_specs.name == "Computer"

    def test_tech_specs_str_representation(self):
        """Test tech specs string representation."""
        tech_specs = TechSpecs.objects.create(name="Computer")
        assert str(tech_specs) == "Computer"

    def test_tech_specs_unique_name(self):
        """Test that tech specs name must be unique."""
        TechSpecs.objects.create(name="Computer")
        with pytest.raises(IntegrityError):
            TechSpecs.objects.create(name="Computer")


@pytest.mark.django_db
class TestAssetCategoryModel:
    """Test cases for AssetCategory model."""

    def test_asset_category_creation(self):
        """Test that an asset category can be created."""
        category = AssetCategory.objects.create(name="Laptop")
        assert category.name == "Laptop"
        assert category.tech_specs is None

    def test_asset_category_with_tech_specs(self):
        """Test that asset category can have tech specs."""
        tech_specs = TechSpecs.objects.create(name="Computer")
        category = AssetCategory.objects.create(name="Laptop", tech_specs=tech_specs)
        assert category.tech_specs == tech_specs

    def test_asset_category_str_representation(self):
        """Test asset category string representation."""
        category = AssetCategory.objects.create(name="Laptop")
        assert str(category) == "Laptop"

    def test_asset_category_unique_name(self):
        """Test that asset category name must be unique."""
        AssetCategory.objects.create(name="Laptop")
        with pytest.raises(IntegrityError):
            AssetCategory.objects.create(name="Laptop")


@pytest.mark.django_db
class TestAssetModel:
    """Test cases for Asset model."""

    def test_asset_creation_minimal(self):
        """Test that an asset can be created with minimal fields."""
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(name="Test Laptop", category=category)
        assert asset.name == "Test Laptop"
        assert asset.category == category
        assert asset.status == "active"  # Default status

    def test_asset_str_representation(self):
        """Test asset string representation."""
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(name="Test Laptop", category=category)
        assert str(asset) == "Test Laptop"

    def test_asset_status_choices(self):
        """Test that asset status must be a valid choice."""
        category = AssetCategory.objects.create(name="Laptop")
        # Valid choices
        asset1 = Asset.objects.create(name="Active Asset", category=category, status="active")
        asset2 = Asset.objects.create(name="Retired Asset", category=category, status="retired")
        asset3 = Asset.objects.create(name="In Repair Asset", category=category, status="in_repair")
        asset4 = Asset.objects.create(name="Disposed Asset", category=category, status="disposed")
        assert asset1.status == "active"
        assert asset2.status == "retired"
        assert asset3.status == "in_repair"
        assert asset4.status == "disposed"

    def test_asset_impact_validation(self):
        """Test that asset impact must be between 1 and 3."""
        category = AssetCategory.objects.create(name="Laptop")
        # Valid impact values
        asset1 = Asset.objects.create(name="Low Impact", category=category, impact=1)
        asset2 = Asset.objects.create(name="Medium Impact", category=category, impact=2)
        asset3 = Asset.objects.create(name="High Impact", category=category, impact=3)
        assert asset1.impact == 1
        assert asset2.impact == 2
        assert asset3.impact == 3

        # Invalid impact value
        asset = Asset(name="Invalid Impact", category=category, impact=0)
        with pytest.raises(ValidationError):
            asset.full_clean()

    def test_asset_relationships(self, user):
        """Test asset relationships with other models."""
        category = AssetCategory.objects.create(name="Laptop")
        vendor = Vendor.objects.create(name="Dell Inc.")
        location = Location.objects.create(name="Office", address1="123 St", city="City")
        lifecycle = CustomLifecycle.objects.create(name="Standard")

        asset = Asset.objects.create(
            name="Test Laptop",
            category=category,
            vendor=vendor,
            location=location,
            assigned_to=user,
            used_by=user,
            managed_by=user,
            custom_lifecycle=lifecycle,
        )
        assert asset.category == category
        assert asset.vendor == vendor
        assert asset.location == location
        assert asset.assigned_to == user
        assert asset.used_by == user
        assert asset.managed_by == user
        assert asset.custom_lifecycle == lifecycle

    def test_asset_many_to_many_relationships(self):
        """Test asset many-to-many relationships."""
        category = AssetCategory.objects.create(name="Laptop")
        tag1 = AssetTag.objects.create(name="Tag1")
        tag2 = AssetTag.objects.create(name="Tag2")
        department1 = Department.objects.create(name="IT")
        department2 = Department.objects.create(name="Finance")

        asset = Asset.objects.create(name="Test Laptop", category=category)
        asset.tags.add(tag1, tag2)
        asset.departments.add(department1, department2)

        assert asset.tags.count() == 2
        assert asset.departments.count() == 2
        assert tag1 in asset.tags.all()
        assert department1 in asset.departments.all()

    def test_asset_get_asset_type(self):
        """Test get_asset_type method."""
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(name="Test Laptop", category=category)
        assert asset.get_asset_type() == "Laptop"

    def test_asset_purchase_price_validation(self):
        """Test that purchase price must be non-negative."""
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset(name="Test Laptop", category=category, purchase_price=-100)
        with pytest.raises(ValidationError):
            asset.full_clean()

    def test_asset_category_cascade_delete(self):
        """Test that deleting category deletes associated assets."""
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(name="Test Laptop", category=category)
        asset_id = asset.id
        category.delete()
        assert not Asset.objects.filter(id=asset_id).exists()


@pytest.mark.django_db
class TestAssetAttachmentModel:
    """Test cases for AssetAttachment model."""

    def test_asset_attachment_creation(self, user):
        """Test that an asset attachment can be created."""
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(name="Test Laptop", category=category)
        # Note: In tests, we can't actually upload files, so we test the model structure
        attachment = AssetAttachment.objects.create(
            asset=asset,
            name="Test Document",
            description="Test description",
            uploaded_by=user,
        )
        assert attachment.asset == asset
        assert attachment.name == "Test Document"
        assert attachment.uploaded_by == user

    def test_asset_attachment_str_representation(self, user):
        """Test asset attachment string representation."""
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(name="Test Laptop", category=category)
        attachment = AssetAttachment.objects.create(
            asset=asset, name="Test Document", uploaded_by=user
        )
        assert "Test Laptop" in str(attachment)
        assert "Test Document" in str(attachment)


@pytest.mark.django_db
class TestAssetRelationModel:
    """Test cases for AssetRelation model."""

    def test_asset_relation_creation(self):
        """Test that an asset relation can be created."""
        category = AssetCategory.objects.create(name="Laptop")
        asset1 = Asset.objects.create(name="Asset 1", category=category)
        asset2 = Asset.objects.create(name="Asset 2", category=category)

        relation = AssetRelation.objects.create(asset=asset1, related_asset=asset2)
        assert relation.asset == asset1
        assert relation.related_asset == asset2

    def test_asset_relation_str_representation(self):
        """Test asset relation string representation."""
        category = AssetCategory.objects.create(name="Laptop")
        asset1 = Asset.objects.create(name="Asset 1", category=category)
        asset2 = Asset.objects.create(name="Asset 2", category=category)

        relation = AssetRelation.objects.create(asset=asset1, related_asset=asset2)
        assert "Asset 1" in str(relation)
        assert "Asset 2" in str(relation)

    def test_asset_relation_unique_together(self):
        """Test that asset and related_asset must be unique together."""
        category = AssetCategory.objects.create(name="Laptop")
        asset1 = Asset.objects.create(name="Asset 1", category=category)
        asset2 = Asset.objects.create(name="Asset 2", category=category)

        AssetRelation.objects.create(asset=asset1, related_asset=asset2)
        # Try to create duplicate relation
        with pytest.raises(IntegrityError):
            AssetRelation.objects.create(asset=asset1, related_asset=asset2)


@pytest.mark.django_db
class TestComputerDetailsModel:
    """Test cases for ComputerDetails model."""

    def test_computer_details_creation(self):
        """Test that computer details can be created."""
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(name="Test Laptop", category=category)
        computer_details = ComputerDetails.objects.create(
            asset=asset,
            cpu="Intel Core i7",
            ram="16GB",
            storage="512GB SSD",
        )
        assert computer_details.asset == asset
        assert computer_details.cpu == "Intel Core i7"
        assert computer_details.ram == "16GB"
        assert computer_details.storage == "512GB SSD"

    def test_computer_details_one_to_one(self):
        """Test that computer details has one-to-one relationship with asset."""
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(name="Test Laptop", category=category)
        ComputerDetails.objects.create(asset=asset)

        # Try to create another computer details for the same asset
        with pytest.raises(IntegrityError):
            ComputerDetails.objects.create(asset=asset)

    def test_computer_details_str_representation(self):
        """Test computer details string representation."""
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(name="Test Laptop", category=category)
        computer_details = ComputerDetails.objects.create(asset=asset)
        assert "Test Laptop" in str(computer_details)


@pytest.mark.django_db
class TestNetworkDetailsModel:
    """Test cases for NetworkDetails model."""

    def test_network_details_creation(self):
        """Test that network details can be created."""
        category = AssetCategory.objects.create(name="Router")
        asset = Asset.objects.create(name="Test Router", category=category)
        network_details = NetworkDetails.objects.create(
            asset=asset,
            mac_address="00:11:22:33:44:55",
            ip_address="192.168.1.1",
            firmware="v1.0",
            ports_count=24,
        )
        assert network_details.asset == asset
        assert network_details.mac_address == "00:11:22:33:44:55"
        assert network_details.ip_address == "192.168.1.1"
        assert network_details.firmware == "v1.0"
        assert network_details.ports_count == 24


@pytest.mark.django_db
class TestCalendarAlertModel:
    """Test cases for CalendarAlert model."""

    def test_calendar_alert_creation(self, user):
        """Test that a calendar alert can be created."""
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(name="Test Laptop", category=category)
        alert = CalendarAlert.objects.create(
            asset=asset,
            date=date.today() + timedelta(days=30),
            message="Warranty expires soon",
            assigned_to=user,
        )
        assert alert.asset == asset
        assert alert.assigned_to == user
        assert alert.message == "Warranty expires soon"

    def test_calendar_alert_str_representation(self):
        """Test calendar alert string representation."""
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(name="Test Laptop", category=category)
        alert_date = date.today() + timedelta(days=30)
        alert = CalendarAlert.objects.create(asset=asset, date=alert_date)
        assert "Test Laptop" in str(alert)
        assert str(alert_date) in str(alert)
