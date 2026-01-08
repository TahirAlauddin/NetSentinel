"""
Tests for FavoriteSubnet model.
"""

import pytest
from django.contrib.auth import get_user_model

from infrastructure.models import Location
from ipam.models import Subnet, SubnetGroup, FavoriteSubnet

User = get_user_model()


@pytest.mark.django_db
class TestFavoriteSubnetModel:
    """Test cases for FavoriteSubnet model."""

    def test_create_favorite_subnet(self, user):
        """Test creating a favorite subnet."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        subnet = Subnet.objects.create(network="192.168.1.0/24", group=group, location=location)

        favorite = FavoriteSubnet.objects.create(user=user, subnet=subnet)
        assert favorite.user == user
        assert favorite.subnet == subnet
        assert FavoriteSubnet.objects.filter(user=user, subnet=subnet).exists()

    def test_favorite_subnet_unique_constraint(self, user):
        """Test that a user cannot favorite the same subnet twice."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        subnet = Subnet.objects.create(network="192.168.1.0/24", group=group, location=location)

        FavoriteSubnet.objects.create(user=user, subnet=subnet)

        # Attempting to create duplicate should raise IntegrityError
        with pytest.raises(Exception):  # IntegrityError or similar
            FavoriteSubnet.objects.create(user=user, subnet=subnet)

    def test_favorite_subnet_different_users(self, user):
        """Test that different users can favorite the same subnet."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        subnet = Subnet.objects.create(network="192.168.1.0/24", group=group, location=location)

        another_user = User.objects.create_user(
            username="anotheruser",
            email="another@example.com",
            password="testpass123",
        )

        favorite1 = FavoriteSubnet.objects.create(user=user, subnet=subnet)
        favorite2 = FavoriteSubnet.objects.create(user=another_user, subnet=subnet)

        assert favorite1.user != favorite2.user
        assert favorite1.subnet == favorite2.subnet
        assert FavoriteSubnet.objects.filter(subnet=subnet).count() == 2

    def test_favorite_subnet_str_representation(self, user):
        """Test the string representation of FavoriteSubnet."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        subnet = Subnet.objects.create(network="192.168.1.0/24", group=group, location=location)

        favorite = FavoriteSubnet.objects.create(user=user, subnet=subnet)
        str_repr = str(favorite)
        assert user.username in str_repr
        assert subnet.network in str_repr

    def test_favorite_subnet_cascade_delete_user(self, user):
        """Test that favorite subnets are deleted when user is deleted."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        subnet = Subnet.objects.create(network="192.168.1.0/24", group=group, location=location)

        favorite = FavoriteSubnet.objects.create(user=user, subnet=subnet)
        favorite_id = favorite.id

        user.delete()

        assert not FavoriteSubnet.objects.filter(id=favorite_id).exists()

    def test_favorite_subnet_cascade_delete_subnet(self, user):
        """Test that favorite subnets are deleted when subnet is deleted."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        subnet = Subnet.objects.create(network="192.168.1.0/24", group=group, location=location)

        favorite = FavoriteSubnet.objects.create(user=user, subnet=subnet)
        favorite_id = favorite.id

        subnet.delete()

        assert not FavoriteSubnet.objects.filter(id=favorite_id).exists()
