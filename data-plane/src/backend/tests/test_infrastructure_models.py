"""
Tests for Infrastructure models.
"""

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from infrastructure.models import (CarrierContact, Category, Circuit, Contact,
                                   Department, Location, PointOfContact,
                                   UtilityContact)


@pytest.mark.django_db
class TestLocationModel:
    """Test cases for Location model."""

    def test_location_creation(self):
        """Test that a location can be created with required fields."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        assert location.name == "Test Location"
        assert location.address1 == "123 Main St"
        assert location.city == "Test City"
        assert location.alias is None
        assert location.address2 is None

    def test_location_str_representation(self):
        """Test location string representation."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        assert str(location) == "Test Location - Test City"

    def test_location_optional_fields(self):
        """Test that optional fields can be set."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
            alias="TL",
            address2="Suite 100",
            state="CA",
            zip_code="12345",
            phone="555-1234",
            longitude=123.456789,
            latitude=45.678901,
            type_building="Office",
            mpoe="MPOE-001",
            dmarc="DMARC-001",
        )
        assert location.alias == "TL"
        assert location.address2 == "Suite 100"
        assert location.state == "CA"
        assert location.zip_code == "12345"
        assert location.phone == "555-1234"
        assert location.longitude == 123.456789
        assert location.latitude == 45.678901
        assert location.type_building == "Office"
        assert location.mpoe == "MPOE-001"
        assert location.dmarc == "DMARC-001"

    def test_location_ordering(self):
        """Test that locations are ordered by name and city."""
        Location.objects.create(name="B Location", address1="123 St", city="A City")
        Location.objects.create(name="A Location", address1="456 St", city="B City")
        Location.objects.create(name="A Location", address1="789 St", city="A City")

        locations = list(Location.objects.all())
        assert locations[0].name == "A Location"
        assert locations[0].city == "A City"
        assert locations[1].name == "A Location"
        assert locations[1].city == "B City"
        assert locations[2].name == "B Location"


@pytest.mark.django_db
class TestCircuitModel:
    """Test cases for Circuit model."""

    def test_circuit_creation(self):
        """Test that a circuit can be created with required fields."""
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
        assert circuit.location == location
        assert circuit.speed == 100
        assert circuit.carrier == "Test Carrier"
        assert circuit.circuit_id is None

    def test_circuit_str_representation_with_circuit_id(self):
        """Test circuit string representation with circuit_id."""
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
        assert "CIRC-001" in str(circuit)
        assert "100 Mbps" in str(circuit)

    def test_circuit_str_representation_without_circuit_id(self):
        """Test circuit string representation without circuit_id."""
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
        assert "Test Carrier" in str(circuit)
        assert "100 Mbps" in str(circuit)

    def test_circuit_speed_validation(self):
        """Test that circuit speed must be at least 1."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        circuit = Circuit(location=location, speed=0, carrier="Test Carrier")
        with pytest.raises(ValidationError):
            circuit.full_clean()

    def test_circuit_location_cascade_delete(self):
        """Test that deleting a location deletes associated circuits."""
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
        circuit_id = circuit.id
        location.delete()
        assert not Circuit.objects.filter(id=circuit_id).exists()

    def test_circuit_ordering(self):
        """Test that circuits are ordered by location and carrier."""
        location1 = Location.objects.create(name="Location A", address1="123 St", city="City A")
        location2 = Location.objects.create(name="Location B", address1="456 St", city="City B")

        Circuit.objects.create(location=location1, speed=100, carrier="Carrier B")
        Circuit.objects.create(location=location1, speed=100, carrier="Carrier A")
        Circuit.objects.create(location=location2, speed=100, carrier="Carrier A")

        circuits = list(Circuit.objects.all())
        assert circuits[0].location == location1
        assert circuits[0].carrier == "Carrier A"
        assert circuits[1].location == location1
        assert circuits[1].carrier == "Carrier B"


@pytest.mark.django_db
class TestPointOfContactModel:
    """Test cases for PointOfContact model."""

    def test_point_of_contact_creation(self):
        """Test that a point of contact can be created."""
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
        assert poc.circuit == circuit
        assert poc.contact_type == "technical"
        assert poc.name == "John Doe"
        assert poc.email == "john@example.com"
        assert poc.phone is None

    def test_point_of_contact_str_representation(self):
        """Test point of contact string representation."""
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
        assert "John Doe" in str(poc)
        assert "Technical PoC" in str(poc)

    def test_point_of_contact_contact_type_choices(self):
        """Test that contact_type must be a valid choice."""
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
        # Valid choices
        poc1 = PointOfContact.objects.create(
            circuit=circuit,
            contact_type="technical",
            name="Tech POC",
            email="tech@example.com",
        )
        poc2 = PointOfContact.objects.create(
            circuit=circuit,
            contact_type="administrative",
            name="Admin POC",
            email="admin@example.com",
        )
        assert poc1.contact_type == "technical"
        assert poc2.contact_type == "administrative"

    def test_point_of_contact_unique_together(self):
        """Test that circuit and contact_type must be unique together."""
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
        PointOfContact.objects.create(
            circuit=circuit,
            contact_type="technical",
            name="John Doe",
            email="john@example.com",
        )
        # Try to create another technical POC for the same circuit
        with pytest.raises(IntegrityError):
            PointOfContact.objects.create(
                circuit=circuit,
                contact_type="technical",
                name="Jane Doe",
                email="jane@example.com",
            )

    def test_point_of_contact_circuit_cascade_delete(self):
        """Test that deleting a circuit deletes associated points of contact."""
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
        poc_id = poc.id
        circuit.delete()
        assert not PointOfContact.objects.filter(id=poc_id).exists()


@pytest.mark.django_db
class TestDepartmentModel:
    """Test cases for Department model."""

    def test_department_creation(self):
        """Test that a department can be created."""
        department = Department.objects.create(name="IT Department")
        assert department.name == "IT Department"

    def test_department_str_representation(self):
        """Test department string representation."""
        department = Department.objects.create(name="IT Department")
        assert str(department) == "IT Department"

    def test_department_unique_name(self):
        """Test that department name must be unique."""
        Department.objects.create(name="IT Department")
        with pytest.raises(IntegrityError):
            Department.objects.create(name="IT Department")

    def test_department_ordering(self):
        """Test that departments are ordered by name."""
        Department.objects.create(name="Z Department")
        Department.objects.create(name="A Department")
        Department.objects.create(name="M Department")

        departments = list(Department.objects.all())
        assert departments[0].name == "A Department"
        assert departments[1].name == "M Department"
        assert departments[2].name == "Z Department"


@pytest.mark.django_db
class TestCategoryModel:
    """Test cases for Category model."""

    def test_category_creation(self):
        """Test that a category can be created."""
        category = Category.objects.create(name="Network Equipment")
        assert category.name == "Network Equipment"

    def test_category_str_representation(self):
        """Test category string representation."""
        category = Category.objects.create(name="Network Equipment")
        assert str(category) == "Network Equipment"

    def test_category_unique_name(self):
        """Test that category name must be unique."""
        Category.objects.create(name="Network Equipment")
        with pytest.raises(IntegrityError):
            Category.objects.create(name="Network Equipment")

    def test_category_ordering(self):
        """Test that categories are ordered by name."""
        Category.objects.create(name="Z Category")
        Category.objects.create(name="A Category")
        Category.objects.create(name="M Category")

        categories = list(Category.objects.all())
        assert categories[0].name == "A Category"
        assert categories[1].name == "M Category"
        assert categories[2].name == "Z Category"


@pytest.mark.django_db
class TestContactModel:
    """Test cases for Contact model."""

    def test_contact_creation(self):
        """Test that a contact can be created with required fields."""
        contact = Contact.objects.create(
            first_name="John",
            last_name="Doe",
        )
        assert contact.first_name == "John"
        assert contact.last_name == "Doe"
        assert contact.job_title is None

    def test_contact_str_representation(self):
        """Test contact string representation."""
        contact = Contact.objects.create(
            first_name="John",
            last_name="Doe",
        )
        assert str(contact) == "John Doe"

    def test_contact_optional_fields(self):
        """Test that optional fields can be set."""
        contact = Contact.objects.create(
            first_name="John",
            last_name="Doe",
            job_title="Engineer",
            business_phone="555-1234",
            mobile_phone="555-5678",
            address1="123 Main St",
            city="Test City",
            state="CA",
            zip_code="12345",
            country="USA",
            contact_type="vendor",
        )
        assert contact.job_title == "Engineer"
        assert contact.business_phone == "555-1234"
        assert contact.mobile_phone == "555-5678"
        assert contact.address1 == "123 Main St"
        assert contact.city == "Test City"
        assert contact.state == "CA"
        assert contact.zip_code == "12345"
        assert contact.country == "USA"
        assert contact.contact_type == "vendor"

    def test_contact_ordering(self):
        """Test that contacts are ordered by last_name and first_name."""
        Contact.objects.create(first_name="John", last_name="Zoe")
        Contact.objects.create(first_name="Jane", last_name="Doe")
        Contact.objects.create(first_name="Bob", last_name="Doe")

        contacts = list(Contact.objects.all())
        assert contacts[0].last_name == "Doe"
        assert contacts[0].first_name == "Bob"
        assert contacts[1].last_name == "Doe"
        assert contacts[1].first_name == "Jane"
        assert contacts[2].last_name == "Zoe"


@pytest.mark.django_db
class TestCarrierContactModel:
    """Test cases for CarrierContact model."""

    def test_carrier_contact_creation(self):
        """Test that a carrier contact can be created."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        carrier_contact = CarrierContact.objects.create(
            name="Test Carrier",
            location=location,
        )
        assert carrier_contact.name == "Test Carrier"
        assert carrier_contact.location == location

    def test_carrier_contact_str_representation(self):
        """Test carrier contact string representation."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        carrier_contact = CarrierContact.objects.create(
            name="Test Carrier",
            location=location,
        )
        assert "Test Carrier" in str(carrier_contact)
        assert "Test Location" in str(carrier_contact)

    def test_carrier_contact_optional_fields(self):
        """Test that optional fields can be set."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        carrier_contact = CarrierContact.objects.create(
            name="Test Carrier",
            location=location,
            customer_service_phone="555-1000",
            technical_support_phone="555-2000",
            sales_phone="555-3000",
            billing_phone="555-4000",
        )
        assert carrier_contact.customer_service_phone == "555-1000"
        assert carrier_contact.technical_support_phone == "555-2000"
        assert carrier_contact.sales_phone == "555-3000"
        assert carrier_contact.billing_phone == "555-4000"

    def test_carrier_contact_location_cascade_delete(self):
        """Test that deleting a location deletes associated carrier contacts."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        carrier_contact = CarrierContact.objects.create(
            name="Test Carrier",
            location=location,
        )
        contact_id = carrier_contact.id
        location.delete()
        assert not CarrierContact.objects.filter(id=contact_id).exists()


@pytest.mark.django_db
class TestUtilityContactModel:
    """Test cases for UtilityContact model."""

    def test_utility_contact_creation(self):
        """Test that a utility contact can be created."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        utility_contact = UtilityContact.objects.create(
            name="Test Utility",
            location=location,
        )
        assert utility_contact.name == "Test Utility"
        assert utility_contact.location == location
        assert utility_contact.utility_type is None

    def test_utility_contact_str_representation_with_type(self):
        """Test utility contact string representation with utility type."""
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
        assert "Test Utility" in str(utility_contact)
        assert "Electric" in str(utility_contact)
        assert "Test Location" in str(utility_contact)

    def test_utility_contact_str_representation_without_type(self):
        """Test utility contact string representation without utility type."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        utility_contact = UtilityContact.objects.create(
            name="Test Utility",
            location=location,
        )
        assert "Unknown" in str(utility_contact)

    def test_utility_contact_utility_type_choices(self):
        """Test that utility_type must be a valid choice."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        # Valid choices
        utility1 = UtilityContact.objects.create(
            name="Electric Utility",
            location=location,
            utility_type="electric",
        )
        utility2 = UtilityContact.objects.create(
            name="Water Utility",
            location=location,
            utility_type="water",
        )
        utility3 = UtilityContact.objects.create(
            name="Sewage Utility",
            location=location,
            utility_type="sewage",
        )
        assert utility1.utility_type == "electric"
        assert utility2.utility_type == "water"
        assert utility3.utility_type == "sewage"

    def test_utility_contact_location_cascade_delete(self):
        """Test that deleting a location deletes associated utility contacts."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        utility_contact = UtilityContact.objects.create(
            name="Test Utility",
            location=location,
        )
        contact_id = utility_contact.id
        location.delete()
        assert not UtilityContact.objects.filter(id=contact_id).exists()
