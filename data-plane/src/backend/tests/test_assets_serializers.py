"""
Tests for Asset serializers.
"""

import pytest
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
    ComputerDetails,
    CalendarAlert,
)
from assets.serializers import (
    AssetTagSerializer,
    VendorSerializer,
    CustomLifecycleSerializer,
    TechSpecsSerializer,
    AssetCategorySerializer,
    AssetSerializer,
    AssetAttachmentSerializer,
    AssetRelationSerializer,
    ComputerDetailsSerializer,
    CalendarAlertSerializer,
)
from infrastructure.models import Location, Department


@pytest.mark.django_db
class TestAssetTagSerializer:
    """Test cases for AssetTagSerializer."""

    def test_asset_tag_serializer_serialization(self):
        """Test that AssetTagSerializer correctly serializes."""
        tag = AssetTag.objects.create(name="Laptop", color="#FF5733")
        serializer = AssetTagSerializer(tag)
        data = serializer.data

        assert data["id"] == tag.id
        assert data["name"] == "Laptop"
        assert data["color"] == "#FF5733"

    def test_asset_tag_serializer_create(self):
        """Test creating an asset tag via serializer."""
        data = {"name": "Desktop", "color": "#33FF57"}
        serializer = AssetTagSerializer(data=data)
        assert serializer.is_valid()
        tag = serializer.save()
        assert tag.name == "Desktop"
        assert tag.color == "#33FF57"


@pytest.mark.django_db
class TestCustomLifecycleSerializer:
    """Test cases for CustomLifecycleSerializer."""

    def test_custom_lifecycle_serializer_serialization(self):
        """Test that CustomLifecycleSerializer correctly serializes."""
        lifecycle = CustomLifecycle.objects.create(
            name="Standard Lifecycle",
            description="Standard asset lifecycle process",
        )
        serializer = CustomLifecycleSerializer(lifecycle)
        data = serializer.data

        assert data["id"] == lifecycle.id
        assert data["name"] == "Standard Lifecycle"
        assert data["description"] == "Standard asset lifecycle process"
        assert "created_at" in data
        assert "updated_at" in data

    def test_custom_lifecycle_serializer_create(self):
        """Test creating a custom lifecycle via serializer."""
        data = {
            "name": "Extended Lifecycle",
            "description": "Extended lifecycle for critical assets",
        }
        serializer = CustomLifecycleSerializer(data=data)
        assert serializer.is_valid()
        lifecycle = serializer.save()
        assert lifecycle.name == "Extended Lifecycle"
        assert lifecycle.description == "Extended lifecycle for critical assets"

    def test_custom_lifecycle_serializer_create_without_description(self):
        """Test creating a custom lifecycle without description."""
        data = {"name": "Simple Lifecycle"}
        serializer = CustomLifecycleSerializer(data=data)
        assert serializer.is_valid()
        lifecycle = serializer.save()
        assert lifecycle.name == "Simple Lifecycle"
        assert lifecycle.description is None or lifecycle.description == ""

    def test_custom_lifecycle_serializer_update(self):
        """Test updating a custom lifecycle via serializer."""
        lifecycle = CustomLifecycle.objects.create(
            name="Original Lifecycle", description="Original description"
        )
        data = {"name": "Updated Lifecycle", "description": "Updated description"}
        serializer = CustomLifecycleSerializer(lifecycle, data=data, partial=True)
        assert serializer.is_valid()
        updated_lifecycle = serializer.save()
        assert updated_lifecycle.name == "Updated Lifecycle"
        assert updated_lifecycle.description == "Updated description"


@pytest.mark.django_db
class TestTechSpecsSerializer:
    """Test cases for TechSpecsSerializer."""

    def test_tech_specs_serializer_serialization(self):
        """Test that TechSpecsSerializer correctly serializes."""
        tech_specs = TechSpecs.objects.create(name="Computer")
        serializer = TechSpecsSerializer(tech_specs)
        data = serializer.data

        assert data["id"] == tech_specs.id
        assert data["name"] == "Computer"

    def test_tech_specs_serializer_create(self):
        """Test creating tech specs via serializer."""
        data = {"name": "Network Equipment"}
        serializer = TechSpecsSerializer(data=data)
        assert serializer.is_valid()
        tech_specs = serializer.save()
        assert tech_specs.name == "Network Equipment"

    def test_tech_specs_serializer_update(self):
        """Test updating tech specs via serializer."""
        tech_specs = TechSpecs.objects.create(name="Original Specs")
        data = {"name": "Updated Specs"}
        serializer = TechSpecsSerializer(tech_specs, data=data, partial=True)
        assert serializer.is_valid()
        updated_tech_specs = serializer.save()
        assert updated_tech_specs.name == "Updated Specs"

    def test_tech_specs_serializer_required_name(self):
        """Test that name is required for tech specs."""
        data = {}
        serializer = TechSpecsSerializer(data=data)
        assert not serializer.is_valid()
        assert "name" in serializer.errors


@pytest.mark.django_db
class TestVendorSerializer:
    """Test cases for VendorSerializer."""

    def test_vendor_serializer_serialization(self):
        """Test that VendorSerializer correctly serializes."""
        vendor = Vendor.objects.create(
            name="Dell Inc.",
            contact_info="contact@dell.com",
            website="https://www.dell.com",
        )
        serializer = VendorSerializer(vendor)
        data = serializer.data

        assert data["id"] == vendor.id
        assert data["name"] == "Dell Inc."
        assert data["contact_info"] == "contact@dell.com"
        assert data["website"] == "https://www.dell.com"

    def test_vendor_serializer_create(self):
        """Test creating a vendor via serializer."""
        data = {
            "name": "HP Inc.",
            "contact_info": "contact@hp.com",
            "website": "https://www.hp.com",
        }
        serializer = VendorSerializer(data=data)
        assert serializer.is_valid()
        vendor = serializer.save()
        assert vendor.name == "HP Inc."

    def test_vendor_serializer_create_without_optional_fields(self):
        """Test creating a vendor without optional fields."""
        data = {"name": "Simple Vendor"}
        serializer = VendorSerializer(data=data)
        assert serializer.is_valid()
        vendor = serializer.save()
        assert vendor.name == "Simple Vendor"
        assert vendor.contact_info is None or vendor.contact_info == ""
        assert vendor.website is None or vendor.website == ""

    def test_vendor_serializer_update(self):
        """Test updating a vendor via serializer."""
        vendor = Vendor.objects.create(name="Original Vendor")
        data = {
            "name": "Updated Vendor",
            "contact_info": "new@vendor.com",
            "website": "https://www.updatedvendor.com",
        }
        serializer = VendorSerializer(vendor, data=data, partial=True)
        assert serializer.is_valid()
        updated_vendor = serializer.save()
        assert updated_vendor.name == "Updated Vendor"
        assert updated_vendor.contact_info == "new@vendor.com"


@pytest.mark.django_db
class TestAssetCategorySerializer:
    """Test cases for AssetCategorySerializer."""

    def test_asset_category_serializer_serialization(self):
        """Test that AssetCategorySerializer correctly serializes."""
        tech_specs = TechSpecs.objects.create(name="Computer")
        category = AssetCategory.objects.create(name="Laptop", tech_specs=tech_specs)
        serializer = AssetCategorySerializer(category)
        data = serializer.data

        assert data["id"] == category.id
        assert data["name"] == "Laptop"
        # tech_specs is a nested TechSpecsSerializer (read_only), so it's a dict
        assert isinstance(data["tech_specs"], dict)
        assert data["tech_specs"]["id"] == tech_specs.id
        assert data["tech_specs"]["name"] == "Computer"
        assert "tech_specs_name" in data

    def test_asset_category_serializer_create(self):
        """Test creating an asset category via serializer."""
        tech_specs = TechSpecs.objects.create(name="Computer")
        # tech_specs is read_only in the serializer, so we can't set it during create
        # We need to set it after creation
        data = {"name": "Desktop"}
        serializer = AssetCategorySerializer(data=data)
        assert serializer.is_valid()
        category = serializer.save()
        assert category.name == "Desktop"
        # Set tech_specs after creation since it's read_only in serializer
        category.tech_specs = tech_specs
        category.save()
        assert category.tech_specs == tech_specs


@pytest.mark.django_db
class TestAssetSerializer:
    """Test cases for AssetSerializer."""

    def test_asset_serializer_serialization(self):
        """Test that AssetSerializer correctly serializes."""
        category = AssetCategory.objects.create(name="Laptop")
        vendor = Vendor.objects.create(name="Dell Inc.")
        location = Location.objects.create(name="Office", address1="123 St", city="City")
        asset = Asset.objects.create(
            name="Test Laptop",
            category=category,
            vendor=vendor,
            location=location,
            asset_tag="LAP-001",
            status="active",
        )
        serializer = AssetSerializer(asset)
        data = serializer.data

        assert data["id"] == asset.id
        assert data["name"] == "Test Laptop"
        # category, vendor, and location are nested serializers (read_only), so they're dicts
        assert isinstance(data["category"], dict)
        assert data["category"]["id"] == category.id
        assert isinstance(data["vendor"], dict)
        assert data["vendor"]["id"] == vendor.id
        assert isinstance(data["location"], dict)
        assert data["location"]["id"] == location.id
        assert data["asset_tag"] == "LAP-001"
        assert data["status"] == "active"

    def test_asset_serializer_nested_relationships(self):
        """Test that AssetSerializer includes nested relationships."""
        category = AssetCategory.objects.create(name="Laptop")
        tag = AssetTag.objects.create(name="Important")
        department = Department.objects.create(name="IT")
        asset = Asset.objects.create(name="Test Laptop", category=category)
        asset.tags.add(tag)
        asset.departments.add(department)

        serializer = AssetSerializer(asset)
        data = serializer.data

        assert "tags" in data
        assert "departments" in data
        assert len(data["tags"]) == 1
        assert len(data["departments"]) == 1


@pytest.mark.django_db
class TestComputerDetailsSerializer:
    """Test cases for ComputerDetailsSerializer."""

    def test_computer_details_serializer_serialization(self):
        """Test that ComputerDetailsSerializer correctly serializes."""
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(name="Test Laptop", category=category)
        computer_details = ComputerDetails.objects.create(
            asset=asset,
            cpu="Intel Core i7",
            ram="16GB",
            storage="512GB SSD",
        )
        serializer = ComputerDetailsSerializer(computer_details)
        data = serializer.data

        assert data["cpu"] == "Intel Core i7"
        assert data["ram"] == "16GB"
        assert data["storage"] == "512GB SSD"


@pytest.mark.django_db
class TestAssetAttachmentSerializer:
    """Test cases for AssetAttachmentSerializer."""

    def test_asset_attachment_serializer_serialization(self, user):
        """Test that AssetAttachmentSerializer correctly serializes."""
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(name="Test Laptop", category=category)
        attachment = AssetAttachment.objects.create(
            asset=asset,
            name="Test Document",
            description="Test description",
            uploaded_by=user,
        )
        serializer = AssetAttachmentSerializer(attachment)
        data = serializer.data

        assert data["id"] == attachment.id
        assert data["name"] == "Test Document"
        assert data["description"] == "Test description"
        assert data["uploaded_by"] == user.id
        assert "uploaded_by_name" in data


@pytest.mark.django_db
class TestAssetRelationSerializer:
    """Test cases for AssetRelationSerializer."""

    def test_asset_relation_serializer_serialization(self):
        """Test that AssetRelationSerializer correctly serializes."""
        category = AssetCategory.objects.create(name="Laptop")
        asset1 = Asset.objects.create(name="Asset 1", category=category)
        asset2 = Asset.objects.create(name="Asset 2", category=category, asset_tag="ASSET-002")
        relation = AssetRelation.objects.create(asset=asset1, related_asset=asset2)
        serializer = AssetRelationSerializer(relation)
        data = serializer.data

        assert data["id"] == relation.id
        assert data["asset"] == asset1.id
        assert data["related_asset"] == asset2.id
        assert data["related_asset_name"] == "Asset 2"
        assert data["related_asset_tag"] == "ASSET-002"


@pytest.mark.django_db
class TestCalendarAlertSerializer:
    """Test cases for CalendarAlertSerializer."""

    def test_calendar_alert_serializer_serialization(self, user):
        """Test that CalendarAlertSerializer correctly serializes."""
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(name="Test Laptop", category=category)
        alert = CalendarAlert.objects.create(
            asset=asset,
            date=date.today() + timedelta(days=30),
            message="Warranty expires soon",
            assigned_to=user,
        )
        serializer = CalendarAlertSerializer(alert)
        data = serializer.data

        assert data["id"] == alert.id
        assert data["message"] == "Warranty expires soon"
        # assigned_to is a nested UserSerializer (read_only), so it's a dict
        assert isinstance(data["assigned_to"], dict)
        assert data["assigned_to"]["id"] == user.id
        assert "date" in data
