"""
Tests for Infrastructure API views.
"""

import pytest
from rest_framework import status
from infrastructure.models import (
    Location,
    Circuit,
    PointOfContact,
    Department,
    Category,
    Contact,
    CarrierContact,
    UtilityContact,
)


@pytest.mark.api
@pytest.mark.django_db
class TestLocationViewSet:
    """Test cases for LocationViewSet."""

    def test_list_locations_requires_authentication(self, api_client):
        """Test that listing locations requires authentication."""
        response = api_client.get("/api/v1/infrastructure/locations/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_locations_success(self, authenticated_api_client):
        """Test that authenticated user can list locations."""
        Location.objects.create(
            name="Location 1",
            address1="123 Main St",
            city="City 1",
        )
        Location.objects.create(
            name="Location 2",
            address1="456 Oak Ave",
            city="City 2",
        )

        response = authenticated_api_client.get("/api/v1/infrastructure/locations/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 2

    def test_create_location_success(self, authenticated_api_client):
        """Test that authenticated user can create a location."""
        data = {
            "name": "New Location",
            "address1": "789 Pine St",
            "city": "New City",
            "state": "CA",
            "zip_code": "12345",
        }
        response = authenticated_api_client.post(
            "/api/v1/infrastructure/locations/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "New Location"
        assert response.data["city"] == "New City"

    def test_retrieve_location_success(self, authenticated_api_client):
        """Test that authenticated user can retrieve a location."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        response = authenticated_api_client.get(f"/api/v1/infrastructure/locations/{location.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Test Location"

    def test_update_location_success(self, authenticated_api_client):
        """Test that authenticated user can update a location."""
        location = Location.objects.create(
            name="Old Name",
            address1="123 Main St",
            city="Old City",
        )
        data = {"name": "New Name", "address1": "123 Main St", "city": "New City"}
        response = authenticated_api_client.put(
            f"/api/v1/infrastructure/locations/{location.id}/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "New Name"
        assert response.data["city"] == "New City"

    def test_partial_update_location_success(self, authenticated_api_client):
        """Test that authenticated user can partially update a location."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        data = {"name": "Updated Name"}
        response = authenticated_api_client.patch(
            f"/api/v1/infrastructure/locations/{location.id}/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Updated Name"
        assert response.data["city"] == "Test City"  # Unchanged

    def test_delete_location_success(self, authenticated_api_client):
        """Test that authenticated user can delete a location."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        response = authenticated_api_client.delete(
            f"/api/v1/infrastructure/locations/{location.id}/"
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Location.objects.filter(id=location.id).exists()

    def test_location_circuits_action(self, authenticated_api_client):
        """Test the circuits custom action."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        circuit1 = Circuit.objects.create(
            location=location,
            speed=100,
            carrier="Carrier 1",
        )
        circuit2 = Circuit.objects.create(
            location=location,
            speed=200,
            carrier="Carrier 2",
        )

        response = authenticated_api_client.get(
            f"/api/v1/infrastructure/locations/{location.id}/circuits/"
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        circuit_ids = [c["id"] for c in response.data]
        assert circuit1.id in circuit_ids
        assert circuit2.id in circuit_ids


@pytest.mark.api
@pytest.mark.django_db
class TestCircuitViewSet:
    """Test cases for CircuitViewSet."""

    def test_list_circuits_requires_authentication(self, api_client):
        """Test that listing circuits requires authentication."""
        response = api_client.get("/api/v1/infrastructure/circuits/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_circuits_success(self, authenticated_api_client):
        """Test that authenticated user can list circuits."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        Circuit.objects.create(location=location, speed=100, carrier="Carrier 1")
        Circuit.objects.create(location=location, speed=200, carrier="Carrier 2")

        response = authenticated_api_client.get("/api/v1/infrastructure/circuits/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 2

    def test_create_circuit_success(self, authenticated_api_client):
        """Test that authenticated user can create a circuit."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        data = {
            "location": location.id,
            "speed": 100,
            "carrier": "New Carrier",
            "circuit_id": "CIRC-001",
        }
        response = authenticated_api_client.post(
            "/api/v1/infrastructure/circuits/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["speed"] == 100
        assert response.data["carrier"] == "New Carrier"
        assert response.data["circuit_id"] == "CIRC-001"

    def test_create_circuit_invalid_speed(self, authenticated_api_client):
        """Test that creating a circuit with invalid speed fails."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        data = {
            "location": location.id,
            "speed": 0,  # Invalid: must be at least 1
            "carrier": "Test Carrier",
        }
        response = authenticated_api_client.post(
            "/api/v1/infrastructure/circuits/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_retrieve_circuit_success(self, authenticated_api_client):
        """Test that authenticated user can retrieve a circuit."""
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
        response = authenticated_api_client.get(f"/api/v1/infrastructure/circuits/{circuit.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["speed"] == 100
        assert response.data["carrier"] == "Test Carrier"

    def test_update_circuit_success(self, authenticated_api_client):
        """Test that authenticated user can update a circuit."""
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
        response = authenticated_api_client.put(
            f"/api/v1/infrastructure/circuits/{circuit.id}/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["speed"] == 200
        assert response.data["carrier"] == "New Carrier"

    def test_delete_circuit_success(self, authenticated_api_client):
        """Test that authenticated user can delete a circuit."""
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
        response = authenticated_api_client.delete(f"/api/v1/infrastructure/circuits/{circuit.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Circuit.objects.filter(id=circuit.id).exists()

    def test_circuit_contacts_action(self, authenticated_api_client):
        """Test the contacts custom action."""
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

        response = authenticated_api_client.get(
            f"/api/v1/infrastructure/circuits/{circuit.id}/contacts/"
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        poc_ids = [p["id"] for p in response.data]
        assert poc1.id in poc_ids
        assert poc2.id in poc_ids


@pytest.mark.api
@pytest.mark.django_db
class TestPointOfContactViewSet:
    """Test cases for PointOfContactViewSet."""

    def test_list_points_of_contact_requires_authentication(self, api_client):
        """Test that listing points of contact requires authentication."""
        response = api_client.get("/api/v1/infrastructure/points-of-contact/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_point_of_contact_success(self, authenticated_api_client):
        """Test that authenticated user can create a point of contact."""
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
            "contact_type": "technical",
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "555-1234",
        }
        response = authenticated_api_client.post(
            "/api/v1/infrastructure/points-of-contact/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "John Doe"
        assert response.data["contact_type"] == "technical"

    def test_create_duplicate_point_of_contact_fails(self, authenticated_api_client):
        """Test that creating duplicate contact type for same circuit fails."""
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
        data = {
            "circuit": circuit.id,
            "contact_type": "technical",
            "name": "Jane Doe",
            "email": "jane@example.com",
        }
        response = authenticated_api_client.post(
            "/api/v1/infrastructure/points-of-contact/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.api
@pytest.mark.django_db
class TestDepartmentViewSet:
    """Test cases for DepartmentViewSet."""

    def test_list_departments_requires_authentication(self, api_client):
        """Test that listing departments requires authentication."""
        response = api_client.get("/api/v1/infrastructure/departments/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_department_success(self, authenticated_api_client):
        """Test that authenticated user can create a department."""
        data = {"name": "IT Department"}
        response = authenticated_api_client.post(
            "/api/v1/infrastructure/departments/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "IT Department"

    def test_create_duplicate_department_fails(self, authenticated_api_client):
        """Test that creating duplicate department name fails."""
        Department.objects.create(name="IT Department")
        data = {"name": "IT Department"}
        response = authenticated_api_client.post(
            "/api/v1/infrastructure/departments/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.api
@pytest.mark.django_db
class TestCategoryViewSet:
    """Test cases for CategoryViewSet."""

    def test_list_categories_requires_authentication(self, api_client):
        """Test that listing categories requires authentication."""
        response = api_client.get("/api/v1/infrastructure/categories/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_create_category_success(self, authenticated_api_client):
        """Test that authenticated user can create a category."""
        data = {"name": "Network Equipment"}
        response = authenticated_api_client.post(
            "/api/v1/infrastructure/categories/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Network Equipment"

    def test_create_duplicate_category_fails(self, authenticated_api_client):
        """Test that creating duplicate category name fails."""
        Category.objects.create(name="Network Equipment")
        data = {"name": "Network Equipment"}
        response = authenticated_api_client.post(
            "/api/v1/infrastructure/categories/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.api
@pytest.mark.django_db
class TestContactViewSet:
    """Test cases for ContactViewSet."""

    def test_list_contacts_requires_authentication(self, api_client):
        """Test that listing contacts requires authentication."""
        response = api_client.get("/api/v1/infrastructure/contacts/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_contacts_success(self, authenticated_api_client):
        """Test that authenticated user can list contacts."""
        Contact.objects.create(
            first_name="John",
            last_name="Doe",
            job_title="Engineer",
        )
        Contact.objects.create(
            first_name="Jane",
            last_name="Smith",
            job_title="Manager",
        )

        response = authenticated_api_client.get("/api/v1/infrastructure/contacts/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 2

    def test_create_contact_success(self, authenticated_api_client):
        """Test that authenticated user can create a contact."""
        data = {
            "first_name": "John",
            "last_name": "Doe",
            "job_title": "Engineer",
            "business_phone": "555-1234",
            "mobile_phone": "555-5678",
        }
        response = authenticated_api_client.post(
            "/api/v1/infrastructure/contacts/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["first_name"] == "John"
        assert response.data["last_name"] == "Doe"
        assert response.data["job_title"] == "Engineer"
        assert response.data["business_phone"] == "555-1234"

    def test_create_contact_minimal_fields(self, authenticated_api_client):
        """Test that contact can be created with only required fields."""
        data = {
            "first_name": "John",
            "last_name": "Doe",
        }
        response = authenticated_api_client.post(
            "/api/v1/infrastructure/contacts/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["first_name"] == "John"
        assert response.data["last_name"] == "Doe"

    def test_retrieve_contact_success(self, authenticated_api_client):
        """Test that authenticated user can retrieve a contact."""
        contact = Contact.objects.create(
            first_name="John",
            last_name="Doe",
            job_title="Engineer",
        )
        response = authenticated_api_client.get(f"/api/v1/infrastructure/contacts/{contact.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["first_name"] == "John"
        assert response.data["last_name"] == "Doe"

    def test_update_contact_success(self, authenticated_api_client):
        """Test that authenticated user can update a contact."""
        contact = Contact.objects.create(
            first_name="John",
            last_name="Doe",
            job_title="Engineer",
        )
        data = {
            "first_name": "Jane",
            "last_name": "Smith",
            "job_title": "Manager",
            "business_phone": "555-9999",
        }
        response = authenticated_api_client.put(
            f"/api/v1/infrastructure/contacts/{contact.id}/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["first_name"] == "Jane"
        assert response.data["last_name"] == "Smith"
        assert response.data["job_title"] == "Manager"

    def test_partial_update_contact_success(self, authenticated_api_client):
        """Test that authenticated user can partially update a contact."""
        contact = Contact.objects.create(
            first_name="John",
            last_name="Doe",
            job_title="Engineer",
        )
        data = {"job_title": "Senior Engineer"}
        response = authenticated_api_client.patch(
            f"/api/v1/infrastructure/contacts/{contact.id}/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["first_name"] == "John"  # Unchanged
        assert response.data["job_title"] == "Senior Engineer"

    def test_delete_contact_success(self, authenticated_api_client):
        """Test that authenticated user can delete a contact."""
        contact = Contact.objects.create(
            first_name="John",
            last_name="Doe",
        )
        response = authenticated_api_client.delete(f"/api/v1/infrastructure/contacts/{contact.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Contact.objects.filter(id=contact.id).exists()


@pytest.mark.api
@pytest.mark.django_db
class TestCarrierContactViewSet:
    """Test cases for CarrierContactViewSet."""

    def test_list_carrier_contacts_requires_authentication(self, api_client):
        """Test that listing carrier contacts requires authentication."""
        response = api_client.get("/api/v1/infrastructure/carrier-contacts/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_carrier_contacts_success(self, authenticated_api_client):
        """Test that authenticated user can list carrier contacts."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        CarrierContact.objects.create(
            name="Carrier 1",
            location=location,
        )
        CarrierContact.objects.create(
            name="Carrier 2",
            location=location,
        )

        response = authenticated_api_client.get("/api/v1/infrastructure/carrier-contacts/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 2

    def test_create_carrier_contact_success(self, authenticated_api_client):
        """Test that authenticated user can create a carrier contact."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        data = {
            "name": "Test Carrier",
            "location": location.id,
            "customer_service_phone": "555-1000",
            "technical_support_phone": "555-2000",
            "sales_phone": "555-3000",
            "billing_phone": "555-4000",
        }
        response = authenticated_api_client.post(
            "/api/v1/infrastructure/carrier-contacts/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Test Carrier"
        assert response.data["location"] == location.id
        assert response.data["customer_service_phone"] == "555-1000"

    def test_create_carrier_contact_minimal_fields(self, authenticated_api_client):
        """Test that carrier contact can be created with only required fields."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        data = {
            "name": "Test Carrier",
            "location": location.id,
        }
        response = authenticated_api_client.post(
            "/api/v1/infrastructure/carrier-contacts/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Test Carrier"

    def test_retrieve_carrier_contact_success(self, authenticated_api_client):
        """Test that authenticated user can retrieve a carrier contact."""
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
        response = authenticated_api_client.get(
            f"/api/v1/infrastructure/carrier-contacts/{carrier_contact.id}/"
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Test Carrier"
        assert response.data["location"] == location.id

    def test_update_carrier_contact_success(self, authenticated_api_client):
        """Test that authenticated user can update a carrier contact."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        carrier_contact = CarrierContact.objects.create(
            name="Old Carrier",
            location=location,
        )
        data = {
            "name": "New Carrier",
            "location": location.id,
            "customer_service_phone": "555-9999",
        }
        response = authenticated_api_client.put(
            f"/api/v1/infrastructure/carrier-contacts/{carrier_contact.id}/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "New Carrier"
        assert response.data["customer_service_phone"] == "555-9999"

    def test_partial_update_carrier_contact_success(self, authenticated_api_client):
        """Test that authenticated user can partially update a carrier contact."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        carrier_contact = CarrierContact.objects.create(
            name="Test Carrier",
            location=location,
        )
        data = {"customer_service_phone": "555-8888"}
        response = authenticated_api_client.patch(
            f"/api/v1/infrastructure/carrier-contacts/{carrier_contact.id}/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Test Carrier"  # Unchanged
        assert response.data["customer_service_phone"] == "555-8888"

    def test_delete_carrier_contact_success(self, authenticated_api_client):
        """Test that authenticated user can delete a carrier contact."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        carrier_contact = CarrierContact.objects.create(
            name="Test Carrier",
            location=location,
        )
        response = authenticated_api_client.delete(
            f"/api/v1/infrastructure/carrier-contacts/{carrier_contact.id}/"
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not CarrierContact.objects.filter(id=carrier_contact.id).exists()

    def test_carrier_contact_location_relationship(self, authenticated_api_client):
        """Test that carrier contact is properly linked to location."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        carrier_contact = CarrierContact.objects.create(
            name="Test Carrier",
            location=location,
        )
        response = authenticated_api_client.get(
            f"/api/v1/infrastructure/carrier-contacts/{carrier_contact.id}/"
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["location"] == location.id
        assert "location_name" in response.data
        assert response.data["location_name"] == location.name


@pytest.mark.api
@pytest.mark.django_db
class TestUtilityContactViewSet:
    """Test cases for UtilityContactViewSet."""

    def test_list_utility_contacts_requires_authentication(self, api_client):
        """Test that listing utility contacts requires authentication."""
        response = api_client.get("/api/v1/infrastructure/utility-contacts/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_utility_contacts_success(self, authenticated_api_client):
        """Test that authenticated user can list utility contacts."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        UtilityContact.objects.create(
            name="Utility 1",
            location=location,
            utility_type="electric",
        )
        UtilityContact.objects.create(
            name="Utility 2",
            location=location,
            utility_type="water",
        )

        response = authenticated_api_client.get("/api/v1/infrastructure/utility-contacts/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 2

    def test_create_utility_contact_success(self, authenticated_api_client):
        """Test that authenticated user can create a utility contact."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        data = {
            "name": "Test Utility",
            "location": location.id,
            "utility_type": "electric",
            "customer_service_phone": "555-1000",
        }
        response = authenticated_api_client.post(
            "/api/v1/infrastructure/utility-contacts/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Test Utility"
        assert response.data["utility_type"] == "electric"
        assert response.data["customer_service_phone"] == "555-1000"

    def test_create_utility_contact_minimal_fields(self, authenticated_api_client):
        """Test that utility contact can be created with only required fields."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        data = {
            "name": "Test Utility",
            "location": location.id,
        }
        response = authenticated_api_client.post(
            "/api/v1/infrastructure/utility-contacts/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Test Utility"

    def test_create_utility_contact_all_types(self, authenticated_api_client):
        """Test creating utility contacts with all utility types."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )

        # Test electric
        data = {
            "name": "Electric Utility",
            "location": location.id,
            "utility_type": "electric",
        }
        response = authenticated_api_client.post(
            "/api/v1/infrastructure/utility-contacts/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["utility_type"] == "electric"
        assert response.data["utility_type_display"] == "Electric"

        # Test water
        data = {
            "name": "Water Utility",
            "location": location.id,
            "utility_type": "water",
        }
        response = authenticated_api_client.post(
            "/api/v1/infrastructure/utility-contacts/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["utility_type"] == "water"
        assert response.data["utility_type_display"] == "Water"

        # Test sewage
        data = {
            "name": "Sewage Utility",
            "location": location.id,
            "utility_type": "sewage",
        }
        response = authenticated_api_client.post(
            "/api/v1/infrastructure/utility-contacts/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["utility_type"] == "sewage"
        assert response.data["utility_type_display"] == "Sewage"

    def test_retrieve_utility_contact_success(self, authenticated_api_client):
        """Test that authenticated user can retrieve a utility contact."""
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
        response = authenticated_api_client.get(
            f"/api/v1/infrastructure/utility-contacts/{utility_contact.id}/"
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Test Utility"
        assert response.data["utility_type"] == "electric"
        assert "utility_type_display" in response.data

    def test_update_utility_contact_success(self, authenticated_api_client):
        """Test that authenticated user can update a utility contact."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        utility_contact = UtilityContact.objects.create(
            name="Old Utility",
            location=location,
            utility_type="electric",
        )
        data = {
            "name": "New Utility",
            "location": location.id,
            "utility_type": "water",
            "customer_service_phone": "555-9999",
        }
        response = authenticated_api_client.put(
            f"/api/v1/infrastructure/utility-contacts/{utility_contact.id}/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "New Utility"
        assert response.data["utility_type"] == "water"
        assert response.data["customer_service_phone"] == "555-9999"

    def test_partial_update_utility_contact_success(self, authenticated_api_client):
        """Test that authenticated user can partially update a utility contact."""
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
        data = {"utility_type": "water"}
        response = authenticated_api_client.patch(
            f"/api/v1/infrastructure/utility-contacts/{utility_contact.id}/",
            data,
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Test Utility"  # Unchanged
        assert response.data["utility_type"] == "water"
        assert response.data["utility_type_display"] == "Water"

    def test_delete_utility_contact_success(self, authenticated_api_client):
        """Test that authenticated user can delete a utility contact."""
        location = Location.objects.create(
            name="Test Location",
            address1="123 Main St",
            city="Test City",
        )
        utility_contact = UtilityContact.objects.create(
            name="Test Utility",
            location=location,
        )
        response = authenticated_api_client.delete(
            f"/api/v1/infrastructure/utility-contacts/{utility_contact.id}/"
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not UtilityContact.objects.filter(id=utility_contact.id).exists()

    def test_utility_contact_location_relationship(self, authenticated_api_client):
        """Test that utility contact is properly linked to location."""
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
        response = authenticated_api_client.get(
            f"/api/v1/infrastructure/utility-contacts/{utility_contact.id}/"
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["location"] == location.id
        assert "location_name" in response.data
        assert response.data["location_name"] == location.name

    def test_utility_contact_utility_type_display(self, authenticated_api_client):
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
        response = authenticated_api_client.get(
            f"/api/v1/infrastructure/utility-contacts/{utility_contact.id}/"
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["utility_type"] == "sewage"
        assert response.data["utility_type_display"] == "Sewage"
