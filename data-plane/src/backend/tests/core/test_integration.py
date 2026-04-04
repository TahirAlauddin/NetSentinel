"""
Integration tests for cross-app relationships and complex workflows.
"""

import pytest
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.db import transaction

from assets.models import (
    Asset,
    AssetAttachment,
    AssetCategory,
    AssetRelation,
    CalendarAlert,
    ComputerDetails,
)
from infrastructure.models import Circuit, Location, PointOfContact
from tests.rbac_helpers import grant_user_permission_through_bundle


@pytest.mark.integration
@pytest.mark.django_db
class TestAssetLocationIntegration:
    """Test integration between Asset and Location models."""

    def test_asset_location_relationship(self, user):
        """Test that assets can be associated with locations."""
        location = Location.objects.create(
            name="Main Office",
            address1="123 Main St",
            city="New York",
        )
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(
            name="Test Laptop",
            category=category,
            location=location,
        )

        assert asset.location == location
        assert location.assets.count() == 1
        assert location.assets.first() == asset

    def test_location_deletion_sets_asset_location_to_null(self, user):
        """Test that deleting a location sets asset location to null (SET_NULL)."""
        location = Location.objects.create(
            name="Main Office",
            address1="123 Main St",
            city="New York",
        )
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(
            name="Test Laptop",
            category=category,
            location=location,
        )

        location.delete()
        asset.refresh_from_db()
        assert asset.location is None

    def test_assets_filtered_by_location(self, user):
        """Test querying assets by location."""
        location1 = Location.objects.create(
            name="Office 1",
            address1="123 Main St",
            city="New York",
        )
        location2 = Location.objects.create(
            name="Office 2",
            address1="456 Oak Ave",
            city="Boston",
        )
        category = AssetCategory.objects.create(name="Laptop")

        asset1 = Asset.objects.create(
            name="Laptop 1",
            category=category,
            location=location1,
        )
        asset2 = Asset.objects.create(
            name="Laptop 2",
            category=category,
            location=location2,
        )

        assets_at_location1 = Asset.objects.filter(location=location1)
        assert assets_at_location1.count() == 1
        assert asset1 in assets_at_location1
        assert asset2 not in assets_at_location1


@pytest.mark.integration
@pytest.mark.django_db
class TestAssetUserIntegration:
    """Test integration between Asset and User models."""

    def test_asset_assigned_to_user(self, user):
        """Test that assets can be assigned to users."""
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(
            name="Test Laptop",
            category=category,
            assigned_to=user,
        )

        assert asset.assigned_to == user
        assert user.assigned_assets.count() == 1
        assert user.assigned_assets.first() == asset

    def test_asset_used_by_user(self, user):
        """Test that assets can be marked as used by users."""
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(
            name="Test Laptop",
            category=category,
            used_by=user,
        )

        assert asset.used_by == user
        assert user.assets_used.count() == 1
        assert user.assets_used.first() == asset

    def test_asset_managed_by_user(self, user):
        """Test that assets can be managed by users."""
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(
            name="Test Laptop",
            category=category,
            managed_by=user,
        )

        assert asset.managed_by == user
        assert user.assets_managed.count() == 1
        assert user.assets_managed.first() == asset

    def test_user_deletion_sets_asset_users_to_null(self, user):
        """Test that deleting a user sets related asset fields to null."""
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(
            name="Test Laptop",
            category=category,
            assigned_to=user,
            used_by=user,
            managed_by=user,
        )

        user.delete()

        asset.refresh_from_db()
        assert asset.assigned_to is None
        assert asset.used_by is None
        assert asset.managed_by is None

    def test_multiple_assets_per_user(self, user):
        """Test that a user can have multiple assets."""
        category = AssetCategory.objects.create(name="Laptop")
        asset1 = Asset.objects.create(
            name="Laptop 1",
            category=category,
            assigned_to=user,
        )
        asset2 = Asset.objects.create(
            name="Laptop 2",
            category=category,
            assigned_to=user,
        )

        assert user.assigned_assets.count() == 2
        assert asset1 in user.assigned_assets.all()
        assert asset2 in user.assigned_assets.all()


@pytest.mark.integration
@pytest.mark.django_db
class TestCircuitLocationIntegration:
    """Test integration between Circuit and Location models."""

    def test_circuit_location_relationship(self):
        """Test that circuits belong to locations."""
        location = Location.objects.create(
            name="Main Office",
            address1="123 Main St",
            city="New York",
        )
        circuit = Circuit.objects.create(
            location=location,
            speed=1000,
            carrier="Verizon",
        )

        assert circuit.location == location
        assert location.circuits.count() == 1
        assert location.circuits.first() == circuit

    def test_location_deletion_cascades_to_circuits(self):
        """Test that deleting a location cascades to delete circuits (CASCADE)."""
        location = Location.objects.create(
            name="Main Office",
            address1="123 Main St",
            city="New York",
        )
        circuit = Circuit.objects.create(
            location=location,
            speed=1000,
            carrier="Verizon",
        )

        circuit_id = circuit.id
        location.delete()

        assert not Circuit.objects.filter(id=circuit_id).exists()

    def test_multiple_circuits_per_location(self):
        """Test that a location can have multiple circuits."""
        location = Location.objects.create(
            name="Main Office",
            address1="123 Main St",
            city="New York",
        )
        circuit1 = Circuit.objects.create(
            location=location,
            speed=1000,
            carrier="Verizon",
        )
        circuit2 = Circuit.objects.create(
            location=location,
            speed=500,
            carrier="AT&T",
        )

        assert location.circuits.count() == 2
        assert circuit1 in location.circuits.all()
        assert circuit2 in location.circuits.all()


@pytest.mark.integration
@pytest.mark.django_db
class TestUserPermissionIntegration:
    """Test integration between User, Group, PermissionBundle, and Django Permission."""

    def test_user_permission_via_bundle(self, user):
        perm_str = grant_user_permission_through_bundle(user, codename="integration_view_assets")
        assert user.has_perm(perm_str) is True

    def test_permission_delete_stops_granting_via_bundle(self, user):
        UserModel = get_user_model()
        perm_str = grant_user_permission_through_bundle(user, codename="to_delete_perm")
        assert user.has_perm(perm_str) is True
        _app_label, codename = perm_str.split(".", 1)
        ct = ContentType.objects.get_for_model(UserModel)
        Permission.objects.filter(codename=codename, content_type=ct).delete()
        user = UserModel.objects.get(pk=user.pk)
        assert user.has_perm(perm_str) is False

    def test_group_deletion_removes_bundle_access(self, user):
        UserModel = get_user_model()
        perm_str = grant_user_permission_through_bundle(user, codename="group_delete_perm")
        assert user.has_perm(perm_str) is True
        group = user.groups.first()
        group_id = group.id
        uid = user.pk
        group.delete()
        user = UserModel.objects.get(pk=uid)
        assert not user.groups.filter(id=group_id).exists()
        assert user.has_perm(perm_str) is False


@pytest.mark.integration
@pytest.mark.django_db
class TestAssetCategoryIntegration:
    """Test integration between Asset and Category models."""

    def test_asset_category_relationship(self):
        """Test that assets belong to categories."""
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(
            name="Test Laptop",
            category=category,
        )

        assert asset.category == category
        assert category.assets.count() == 1
        assert category.assets.first() == asset

    def test_category_deletion_cascades_to_assets(self):
        """Test that deleting a category cascades to delete assets (CASCADE)."""
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(
            name="Test Laptop",
            category=category,
        )

        asset_id = asset.id
        category.delete()

        assert not Asset.objects.filter(id=asset_id).exists()

    def test_multiple_assets_per_category(self):
        """Test that a category can have multiple assets."""
        category = AssetCategory.objects.create(name="Laptop")
        asset1 = Asset.objects.create(
            name="Laptop 1",
            category=category,
        )
        asset2 = Asset.objects.create(
            name="Laptop 2",
            category=category,
        )

        assert category.assets.count() == 2
        assert asset1 in category.assets.all()
        assert asset2 in category.assets.all()


@pytest.mark.integration
@pytest.mark.django_db
class TestComplexQueries:
    """Test complex queries across multiple apps."""

    def test_assets_by_location_and_category(self, user):
        """Test querying assets filtered by both location and category."""
        location = Location.objects.create(
            name="Main Office",
            address1="123 Main St",
            city="New York",
        )
        category1 = AssetCategory.objects.create(name="Laptop")
        category2 = AssetCategory.objects.create(name="Desktop")

        asset1 = Asset.objects.create(
            name="Laptop 1",
            category=category1,
            location=location,
        )
        asset2 = Asset.objects.create(
            name="Desktop 1",
            category=category2,
            location=location,
        )
        asset3 = Asset.objects.create(
            name="Laptop 2",
            category=category1,
            location=location,
        )

        # Query laptops at this location
        laptops_at_location = Asset.objects.filter(category=category1, location=location)
        assert laptops_at_location.count() == 2
        assert asset1 in laptops_at_location
        assert asset3 in laptops_at_location
        assert asset2 not in laptops_at_location

    def test_assets_by_user_and_location(self, user):
        """Test querying assets filtered by user and location."""
        location = Location.objects.create(
            name="Main Office",
            address1="123 Main St",
            city="New York",
        )
        category = AssetCategory.objects.create(name="Laptop")

        asset1 = Asset.objects.create(
            name="Laptop 1",
            category=category,
            location=location,
            assigned_to=user,
        )
        asset2 = Asset.objects.create(
            name="Laptop 2",
            category=category,
            location=location,
        )

        # Query assets assigned to user at this location
        user_assets_at_location = Asset.objects.filter(assigned_to=user, location=location)
        assert user_assets_at_location.count() == 1
        assert asset1 in user_assets_at_location
        assert asset2 not in user_assets_at_location

    def test_circuits_with_contacts_at_location(self):
        """Test querying circuits with their contacts at a location."""
        location = Location.objects.create(
            name="Main Office",
            address1="123 Main St",
            city="New York",
        )
        circuit = Circuit.objects.create(
            location=location,
            speed=1000,
            carrier="Verizon",
        )
        contact = PointOfContact.objects.create(
            circuit=circuit,
            contact_type="technical",
            name="John Doe",
            email="john@example.com",
        )

        # Query circuits with their contacts
        circuits_with_contacts = Circuit.objects.filter(location=location).prefetch_related(
            "points_of_contact"
        )

        assert circuits_with_contacts.count() == 1
        circuit_result = circuits_with_contacts.first()
        assert circuit_result.points_of_contact.count() == 1
        assert contact in circuit_result.points_of_contact.all()


@pytest.mark.integration
@pytest.mark.django_db
class TestTransactionHandling:
    """Test transaction handling and rollback scenarios."""

    def test_transaction_rollback_on_error(self):
        """Test that transaction rollback works correctly."""
        category = AssetCategory.objects.create(name="Laptop")

        # Start a transaction
        try:
            with transaction.atomic():
                Asset.objects.create(
                    name="Laptop 1",
                    category=category,
                )
                # Simulate an error
                raise ValueError("Test error")
        except ValueError:
            pass

        # Asset should not be created due to rollback
        assert Asset.objects.count() == 0

    def test_nested_transaction_rollback(self):
        """Test nested transaction rollback."""
        category = AssetCategory.objects.create(name="Laptop")

        try:
            with transaction.atomic():
                Asset.objects.create(
                    name="Laptop 1",
                    category=category,
                )
                try:
                    with transaction.atomic():
                        Asset.objects.create(
                            name="Laptop 2",
                            category=category,
                        )
                        raise ValueError("Inner error")
                except ValueError:
                    pass
                # Outer transaction should still be active
                assert Asset.objects.count() == 1
                raise ValueError("Outer error")
        except ValueError:
            pass

        # All assets should be rolled back
        assert Asset.objects.count() == 0

    def test_savepoint_rollback(self):
        """Test savepoint rollback within a transaction."""
        category = AssetCategory.objects.create(name="Laptop")

        with transaction.atomic():
            asset1 = Asset.objects.create(
                name="Laptop 1",
                category=category,
            )
            savepoint = transaction.savepoint()

            Asset.objects.create(
                name="Laptop 2",
                category=category,
            )
            # Rollback to savepoint
            transaction.savepoint_rollback(savepoint)

            # Only first asset should exist
            assert Asset.objects.count() == 1
            assert Asset.objects.first() == asset1


@pytest.mark.integration
@pytest.mark.django_db
class TestCascadeDeletions:
    """Test cascade deletion behaviors."""

    def test_asset_category_cascade_delete(self):
        """Test that deleting a category deletes its assets."""
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(
            name="Test Laptop",
            category=category,
        )

        asset_id = asset.id
        category.delete()

        assert not Asset.objects.filter(id=asset_id).exists()

    def test_circuit_location_cascade_delete(self):
        """Test that deleting a location deletes its circuits."""
        location = Location.objects.create(
            name="Main Office",
            address1="123 Main St",
            city="New York",
        )
        circuit = Circuit.objects.create(
            location=location,
            speed=1000,
            carrier="Verizon",
        )

        circuit_id = circuit.id
        location.delete()

        assert not Circuit.objects.filter(id=circuit_id).exists()

    def test_point_of_contact_circuit_cascade_delete(self):
        """Test that deleting a circuit deletes its points of contact."""
        location = Location.objects.create(
            name="Main Office",
            address1="123 Main St",
            city="New York",
        )
        circuit = Circuit.objects.create(
            location=location,
            speed=1000,
            carrier="Verizon",
        )
        contact = PointOfContact.objects.create(
            circuit=circuit,
            contact_type="technical",
            name="John Doe",
            email="john@example.com",
        )

        contact_id = contact.id
        circuit.delete()

        assert not PointOfContact.objects.filter(id=contact_id).exists()

    def test_asset_attachment_cascade_delete(self, user):
        """Test that deleting an asset deletes its attachments."""
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(
            name="Test Laptop",
            category=category,
        )
        attachment = AssetAttachment.objects.create(
            asset=asset,
            name="Manual",
            uploaded_by=user,
        )

        attachment_id = attachment.id
        asset.delete()

        assert not AssetAttachment.objects.filter(id=attachment_id).exists()

    def test_calendar_alert_asset_cascade_delete(self, user):
        """Test that deleting an asset deletes its calendar alerts."""
        from datetime import date

        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(
            name="Test Laptop",
            category=category,
        )
        alert = CalendarAlert.objects.create(
            asset=asset,
            date=date.today(),
            message="Maintenance due",
            assigned_to=user,
        )

        alert_id = alert.id
        asset.delete()

        assert not CalendarAlert.objects.filter(id=alert_id).exists()

    def test_asset_relation_cascade_delete(self):
        """Test that deleting an asset deletes its relations."""
        category = AssetCategory.objects.create(name="Laptop")
        asset1 = Asset.objects.create(
            name="Laptop 1",
            category=category,
        )
        asset2 = Asset.objects.create(
            name="Laptop 2",
            category=category,
        )
        relation = AssetRelation.objects.create(
            asset=asset1,
            related_asset=asset2,
        )

        relation_id = relation.id
        asset1.delete()

        assert not AssetRelation.objects.filter(id=relation_id).exists()

    def test_computer_details_asset_cascade_delete(self):
        """Test that deleting an asset deletes its computer details."""
        category = AssetCategory.objects.create(name="Laptop")
        asset = Asset.objects.create(
            name="Test Laptop",
            category=category,
        )
        ComputerDetails.objects.create(
            asset=asset,
            cpu="Intel i7",
            ram="16GB",
        )

        asset_id = asset.id
        asset.delete()

        # ComputerDetails uses asset as primary key, so check if it exists for the deleted asset
        assert not ComputerDetails.objects.filter(asset_id=asset_id).exists()
