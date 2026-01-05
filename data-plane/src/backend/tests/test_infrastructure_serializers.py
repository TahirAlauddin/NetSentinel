"""
Tests for Infrastructure serializers.
"""

import pytest

from infrastructure.models import (CarrierContact, Category, Circuit, Contact,
                                   Department, Location, PointOfContact,
                                   UtilityContact)
from infrastructure.serializers import (CarrierContactSerializer,
                                        CategorySerializer, CircuitSerializer,
                                        ContactSerializer,
                                        DepartmentSerializer,
                                        LocationSerializer,
                                        PointOfContactSerializer,
                                        UtilityContactSerializer)


@pytest.mark.django_db
class TestLocationSerializer:
    """Test cases for LocationSerializer."""

    def test_location_serializer_serialization(self):
        """Test that LocationSerializer correctly serializes a location."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
            state="CA",
            zip_code="12345",
        )
        serializer = LocationSerializer(location)
        data = serializer.data

        assert data["id"] == location.id
        assert data["name"] == "Test Location"
        assert data["address1"] == "123 Main St"
        assert data["city"] == "Test City"
        assert data["state"] == "CA"
        assert data["zip_code"] == "12345"
        assert "circuits" in data
        assert "circuit_count" in data
        assert data["circuit_count"] == 0

    def test_location_serializer_circuit_count(self):
        """Test that circuit_count correctly counts circuits."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        Circuit.objects.create(location=location, speed=100, carrier="Carrier 1")
        Circuit.objects.create(location=location, speed=200, carrier="Carrier 2")

        serializer = LocationSerializer(location)
        data = serializer.data
        assert data["circuit_count"] == 2

    def test_location_serializer_nested_circuits(self):
        """Test that circuits are nested in serialization."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        circuit = Circuit.objects.create(
            location=location,
            speed=100,
            carrier="Test Carrier",
        )

        serializer = LocationSerializer(location)
        data = serializer.data
        assert isinstance(data["circuits"], list)
        assert len(data["circuits"]) == 1
        assert data["circuits"][0]["id"] == circuit.id
        assert data["circuits"][0]["speed"] == 100

    def test_location_serializer_create(self):
        """Test creating a location via serializer."""
        data = {
            "name": "New Location",
            "address1": "456 Oak Ave",
            "city": "New City",
            "state": "NY",
            "zip_code": "54321",
        }
        serializer = LocationSerializer(data=data)
        assert serializer.is_valid()
        location = serializer.save()
        assert location.name == "New Location"
        assert location.city == "New City"

    def test_location_serializer_update(self):
        """Test updating a location via serializer."""
        location = Location.objects.create(
            name="Old Name",
            address1="123 Main St",
            city="Old City",
        )
        data = {
            "name": "New Name",
            "address1": "123 Main St",
            "city": "New City",
        }
        serializer = LocationSerializer(location, data=data)
        assert serializer.is_valid()
        updated_location = serializer.save()
        assert updated_location.name == "New Name"
        assert updated_location.city == "New City"


@pytest.mark.django_db
class TestCircuitSerializer:
    """Test cases for CircuitSerializer."""

    def test_circuit_serializer_serialization(self):
        """Test that CircuitSerializer correctly serializes a circuit."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        circuit = Circuit.objects.create(
            location=location,
            speed=100,
            carrier="Test Carrier",
            circuit_id="CIRC-001",
        )
        serializer = CircuitSerializer(circuit)
        data = serializer.data

        assert data["id"] == circuit.id
        assert data["location"] == location.id
        assert data["location_name"] == str(location)
        assert data["speed"] == 100
        assert data["carrier"] == "Test Carrier"
        assert data["circuit_id"] == "CIRC-001"
        assert "points_of_contact" in data

    def test_circuit_serializer_nested_points_of_contact(self):
        """Test that points_of_contact are nested in serialization."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        circuit = Circuit.objects.create(
            location=location,
            speed=100,
            carrier="Test Carrier",
        )
        poc = PointOfContact.objects.create(
            circuit=circuit,
            contact_type="technical",
            name="John Doe",
            email="john@example.com",
        )

        serializer = CircuitSerializer(circuit)
        data = serializer.data
        assert isinstance(data["points_of_contact"], list)
        assert len(data["points_of_contact"]) == 1
        assert data["points_of_contact"][0]["id"] == poc.id
        assert data["points_of_contact"][0]["name"] == "John Doe"

    def test_circuit_serializer_create(self):
        """Test creating a circuit via serializer."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        data = {
            "location": location.id,
            "speed": 100,
            "carrier": "New Carrier",
            "circuit_id": "CIRC-002",
        }
        serializer = CircuitSerializer(data=data)
        assert serializer.is_valid()
        circuit = serializer.save()
        assert circuit.speed == 100
        assert circuit.carrier == "New Carrier"
        assert circuit.circuit_id == "CIRC-002"

    def test_circuit_serializer_update(self):
        """Test updating a circuit via serializer."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        circuit = Circuit.objects.create(
            location=location,
            speed=100,
            carrier="Old Carrier",
        )
        data = {
            "location": location.id,
            "speed": 200,
            "carrier": "New Carrier",
        }
        serializer = CircuitSerializer(circuit, data=data)
        assert serializer.is_valid()
        updated_circuit = serializer.save()
        assert updated_circuit.speed == 200
        assert updated_circuit.carrier == "New Carrier"


@pytest.mark.django_db
class TestPointOfContactSerializer:
    """Test cases for PointOfContactSerializer."""

    def test_point_of_contact_serializer_serialization(self):
        """Test that PointOfContactSerializer correctly serializes."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        circuit = Circuit.objects.create(
            location=location,
            speed=100,
            carrier="Test Carrier",
        )
        poc = PointOfContact.objects.create(
            circuit=circuit,
            contact_type="technical",
            name="John Doe",
            email="john@example.com",
            phone="555-1234",
        )
        serializer = PointOfContactSerializer(poc)
        data = serializer.data

        assert data["id"] == poc.id
        assert data["circuit"] == circuit.id
        assert data["contact_type"] == "technical"
        assert data["contact_type_display"] == "Technical PoC"
        assert data["name"] == "John Doe"
        assert data["email"] == "john@example.com"
        assert data["phone"] == "555-1234"

    def test_point_of_contact_serializer_create(self):
        """Test creating a point of contact via serializer."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        circuit = Circuit.objects.create(
            location=location,
            speed=100,
            carrier="Test Carrier",
        )
        data = {
            "circuit": circuit.id,
            "contact_type": "administrative",
            "name": "Jane Doe",
            "email": "jane@example.com",
        }
        serializer = PointOfContactSerializer(data=data)
        assert serializer.is_valid()
        poc = serializer.save()
        assert poc.contact_type == "administrative"
        assert poc.name == "Jane Doe"


@pytest.mark.django_db
class TestDepartmentSerializer:
    """Test cases for DepartmentSerializer."""

    def test_department_serializer_serialization(self):
        """Test that DepartmentSerializer correctly serializes a department."""
        department = Department.objects.create(name="IT Department")
        serializer = DepartmentSerializer(department)
        data = serializer.data

        assert data["id"] == department.id
        assert data["name"] == "IT Department"
        assert "created_at" in data
        assert "updated_at" in data

    def test_department_serializer_create(self):
        """Test creating a department via serializer."""
        data = {"name": "HR Department"}
        serializer = DepartmentSerializer(data=data)
        assert serializer.is_valid()
        department = serializer.save()
        assert department.name == "HR Department"

    def test_department_serializer_update(self):
        """Test updating a department via serializer."""
        department = Department.objects.create(name="Old Department")
        data = {"name": "New Department"}
        serializer = DepartmentSerializer(department, data=data)
        assert serializer.is_valid()
        updated_department = serializer.save()
        assert updated_department.name == "New Department"


@pytest.mark.django_db
class TestCategorySerializer:
    """Test cases for CategorySerializer."""

    def test_category_serializer_serialization(self):
        """Test that CategorySerializer correctly serializes a category."""
        category = Category.objects.create(name="Network Equipment")
        serializer = CategorySerializer(category)
        data = serializer.data

        assert data["id"] == category.id
        assert data["name"] == "Network Equipment"
        assert "created_at" in data
        assert "updated_at" in data

    def test_category_serializer_create(self):
        """Test creating a category via serializer."""
        data = {"name": "Software"}
        serializer = CategorySerializer(data=data)
        assert serializer.is_valid()
        category = serializer.save()
        assert category.name == "Software"


@pytest.mark.django_db
class TestContactSerializer:
    """Test cases for ContactSerializer."""

    def test_contact_serializer_serialization(self):
        """Test that ContactSerializer correctly serializes a contact."""
        contact = Contact.objects.create(
            first_name="John",
            last_name="Doe",
            job_title="Engineer",
            business_phone="555-1234",
        )
        serializer = ContactSerializer(contact)
        data = serializer.data

        assert data["id"] == contact.id
        assert data["first_name"] == "John"
        assert data["last_name"] == "Doe"
        assert data["job_title"] == "Engineer"
        assert data["business_phone"] == "555-1234"

    def test_contact_serializer_create(self):
        """Test creating a contact via serializer."""
        data = {
            "first_name": "Jane",
            "last_name": "Smith",
            "job_title": "Manager",
            "mobile_phone": "555-5678",
        }
        serializer = ContactSerializer(data=data)
        assert serializer.is_valid()
        contact = serializer.save()
        assert contact.first_name == "Jane"
        assert contact.last_name == "Smith"


@pytest.mark.django_db
class TestCarrierContactSerializer:
    """Test cases for CarrierContactSerializer."""

    def test_carrier_contact_serializer_serialization(self):
        """Test that CarrierContactSerializer correctly serializes."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        carrier_contact = CarrierContact.objects.create(
            name="Test Carrier",
            location=location,
            customer_service_phone="555-1000",
        )
        serializer = CarrierContactSerializer(carrier_contact)
        data = serializer.data

        assert data["id"] == carrier_contact.id
        assert data["name"] == "Test Carrier"
        assert data["location"] == location.id
        assert data["location_name"] == location.name
        assert data["customer_service_phone"] == "555-1000"

    def test_carrier_contact_serializer_create(self):
        """Test creating a carrier contact via serializer."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        data = {
            "name": "New Carrier",
            "location": location.id,
            "technical_support_phone": "555-2000",
        }
        serializer = CarrierContactSerializer(data=data)
        assert serializer.is_valid()
        carrier_contact = serializer.save()
        assert carrier_contact.name == "New Carrier"
        assert carrier_contact.location == location


@pytest.mark.django_db
class TestUtilityContactSerializer:
    """Test cases for UtilityContactSerializer."""

    def test_utility_contact_serializer_serialization(self):
        """Test that UtilityContactSerializer correctly serializes."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        utility_contact = UtilityContact.objects.create(
            name="Test Utility",
            location=location,
            utility_type="electric",
        )
        serializer = UtilityContactSerializer(utility_contact)
        data = serializer.data

        assert data["id"] == utility_contact.id
        assert data["name"] == "Test Utility"
        assert data["location"] == location.id
        assert data["location_name"] == location.name
        assert data["utility_type"] == "electric"
        assert data["utility_type_display"] == "Electric"

    def test_utility_contact_serializer_create(self):
        """Test creating a utility contact via serializer."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        data = {
            "name": "New Utility",
            "location": location.id,
            "utility_type": "water",
        }
        serializer = UtilityContactSerializer(data=data)
        assert serializer.is_valid()
        utility_contact = serializer.save()
        assert utility_contact.name == "New Utility"
        assert utility_contact.utility_type == "water"

    def test_utility_contact_serializer_utility_type_display(self):
        """Test that utility_type_display shows correct display value."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        utility_contact = UtilityContact.objects.create(
            name="Test Utility",
            location=location,
            utility_type="sewage",
        )
        serializer = UtilityContactSerializer(utility_contact)
        data = serializer.data
        assert data["utility_type_display"] == "Sewage"
