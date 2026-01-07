"""
Tests for IPAM API views.
"""

import pytest
from rest_framework import status

from infrastructure.models import Location
from ipam.models import VLAN, VRF, Customer, DNSRecord, DNSZone, IPAddress, Subnet, SubnetGroup


@pytest.mark.api
@pytest.mark.django_db
class TestCustomerViewSet:
    """Test cases for CustomerViewSet."""

    def test_list_customers_requires_authentication(self, api_client):
        """Test that listing customers requires authentication."""
        response = api_client.get("/api/v1/ipam/customers/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_customers_success(self, authenticated_api_client):
        """Test that authenticated user can list customers."""
        Customer.objects.create(name="Customer 1")
        Customer.objects.create(name="Customer 2")

        response = authenticated_api_client.get("/api/v1/ipam/customers/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 2

    def test_create_customer_success(self, authenticated_api_client):
        """Test that authenticated user can create a customer."""
        data = {
            "name": "New Customer",
            "description": "Test description",
            "contact_email": "customer@example.com",
            "contact_phone": "555-1234",
        }
        response = authenticated_api_client.post("/api/v1/ipam/customers/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "New Customer"
        assert response.data["contact_email"] == "customer@example.com"

    def test_retrieve_customer_success(self, authenticated_api_client):
        """Test that authenticated user can retrieve a customer."""
        customer = Customer.objects.create(name="Test Customer")
        response = authenticated_api_client.get(f"/api/v1/ipam/customers/{customer.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Test Customer"

    def test_update_customer_success(self, authenticated_api_client):
        """Test that authenticated user can update a customer."""
        customer = Customer.objects.create(name="Old Name")
        data = {"name": "New Name", "contact_email": "new@example.com"}
        response = authenticated_api_client.put(
            f"/api/v1/ipam/customers/{customer.id}/", data, format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "New Name"

    def test_partial_update_customer_success(self, authenticated_api_client):
        """Test that authenticated user can partially update a customer."""
        customer = Customer.objects.create(name="Test Customer")
        data = {"name": "Updated Name"}
        response = authenticated_api_client.patch(
            f"/api/v1/ipam/customers/{customer.id}/", data, format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Updated Name"

    def test_delete_customer_success(self, authenticated_api_client):
        """Test that authenticated user can delete a customer."""
        customer = Customer.objects.create(name="Test Customer")
        response = authenticated_api_client.delete(f"/api/v1/ipam/customers/{customer.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Customer.objects.filter(id=customer.id).exists()


@pytest.mark.api
@pytest.mark.django_db
class TestSubnetGroupViewSet:
    """Test cases for SubnetGroupViewSet."""

    def test_list_subnet_groups_requires_authentication(self, api_client):
        """Test that listing subnet groups requires authentication."""
        response = api_client.get("/api/v1/ipam/subnet-groups/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_subnet_groups_success(self, authenticated_api_client):
        """Test that authenticated user can list subnet groups."""
        SubnetGroup.objects.create(name="Group 1")
        SubnetGroup.objects.create(name="Group 2")

        response = authenticated_api_client.get("/api/v1/ipam/subnet-groups/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 2

    def test_create_subnet_group_success(self, authenticated_api_client):
        """Test that authenticated user can create a subnet group."""
        data = {"name": "New Group", "description": "Test description"}
        response = authenticated_api_client.post("/api/v1/ipam/subnet-groups/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "New Group"

    def test_create_duplicate_subnet_group_fails(self, authenticated_api_client):
        """Test that creating duplicate subnet group name fails."""
        SubnetGroup.objects.create(name="Existing Group")
        data = {"name": "Existing Group"}
        response = authenticated_api_client.post("/api/v1/ipam/subnet-groups/", data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_retrieve_subnet_group_success(self, authenticated_api_client):
        """Test that authenticated user can retrieve a subnet group."""
        group = SubnetGroup.objects.create(name="Test Group")
        response = authenticated_api_client.get(f"/api/v1/ipam/subnet-groups/{group.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Test Group"

    def test_delete_subnet_group_success(self, authenticated_api_client):
        """Test that authenticated user can delete a subnet group."""
        group = SubnetGroup.objects.create(name="Test Group")
        response = authenticated_api_client.delete(f"/api/v1/ipam/subnet-groups/{group.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not SubnetGroup.objects.filter(id=group.id).exists()


@pytest.mark.api
@pytest.mark.django_db
class TestVLANViewSet:
    """Test cases for VLANViewSet."""

    def test_list_vlans_requires_authentication(self, api_client):
        """Test that listing VLANs requires authentication."""
        response = api_client.get("/api/v1/ipam/vlans/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_vlans_success(self, authenticated_api_client):
        """Test that authenticated user can list VLANs."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        VLAN.objects.create(vlan_id=100, name="VLAN 1", location=location)
        VLAN.objects.create(vlan_id=200, name="VLAN 2", location=location)

        response = authenticated_api_client.get("/api/v1/ipam/vlans/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 2

    def test_create_vlan_success(self, authenticated_api_client):
        """Test that authenticated user can create a VLAN."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        data = {
            "vlan_id": 100,
            "name": "Test VLAN",
            "location": location.id,
            "description": "Test description",
        }
        response = authenticated_api_client.post("/api/v1/ipam/vlans/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["vlan_id"] == 100
        assert response.data["name"] == "Test VLAN"

    def test_create_vlan_invalid_id_fails(self, authenticated_api_client):
        """Test that creating a VLAN with invalid ID fails."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        data = {"vlan_id": 5000, "name": "Test VLAN", "location": location.id}
        response = authenticated_api_client.post("/api/v1/ipam/vlans/", data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_retrieve_vlan_success(self, authenticated_api_client):
        """Test that authenticated user can retrieve a VLAN."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        vlan = VLAN.objects.create(vlan_id=100, name="Test VLAN", location=location)
        response = authenticated_api_client.get(f"/api/v1/ipam/vlans/{vlan.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["vlan_id"] == 100

    def test_delete_vlan_success(self, authenticated_api_client):
        """Test that authenticated user can delete a VLAN."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        vlan = VLAN.objects.create(vlan_id=100, name="Test VLAN", location=location)
        response = authenticated_api_client.delete(f"/api/v1/ipam/vlans/{vlan.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not VLAN.objects.filter(id=vlan.id).exists()


@pytest.mark.api
@pytest.mark.django_db
class TestVRFViewSet:
    """Test cases for VRFViewSet."""

    def test_list_vrfs_requires_authentication(self, api_client):
        """Test that listing VRFs requires authentication."""
        response = api_client.get("/api/v1/ipam/vrfs/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_vrfs_success(self, authenticated_api_client):
        """Test that authenticated user can list VRFs."""
        VRF.objects.create(name="VRF 1")
        VRF.objects.create(name="VRF 2")

        response = authenticated_api_client.get("/api/v1/ipam/vrfs/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 2

    def test_create_vrf_success(self, authenticated_api_client):
        """Test that authenticated user can create a VRF."""
        data = {"name": "Test VRF", "rd": "65000:100", "description": "Test description"}
        response = authenticated_api_client.post("/api/v1/ipam/vrfs/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "Test VRF"
        assert response.data["rd"] == "65000:100"

    def test_create_vrf_with_location(self, authenticated_api_client):
        """Test that authenticated user can create a VRF with location."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        data = {"name": "Test VRF", "location": location.id}
        response = authenticated_api_client.post("/api/v1/ipam/vrfs/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["location"] == location.id

    def test_retrieve_vrf_success(self, authenticated_api_client):
        """Test that authenticated user can retrieve a VRF."""
        vrf = VRF.objects.create(name="Test VRF")
        response = authenticated_api_client.get(f"/api/v1/ipam/vrfs/{vrf.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "Test VRF"

    def test_delete_vrf_success(self, authenticated_api_client):
        """Test that authenticated user can delete a VRF."""
        vrf = VRF.objects.create(name="Test VRF")
        response = authenticated_api_client.delete(f"/api/v1/ipam/vrfs/{vrf.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not VRF.objects.filter(id=vrf.id).exists()


@pytest.mark.api
@pytest.mark.django_db
class TestSubnetViewSet:
    """Test cases for SubnetViewSet."""

    def test_list_subnets_requires_authentication(self, api_client):
        """Test that listing subnets requires authentication."""
        response = api_client.get("/api/v1/ipam/subnets/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_subnets_success(self, authenticated_api_client):
        """Test that authenticated user can list subnets."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        Subnet.objects.create(network="192.168.1.0/24", group=group, location=location)
        Subnet.objects.create(network="192.168.2.0/24", group=group, location=location)

        response = authenticated_api_client.get("/api/v1/ipam/subnets/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 2

    def test_create_subnet_success(self, authenticated_api_client):
        """Test that authenticated user can create a subnet."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        data = {
            "network": "192.168.1.0/24",
            "group": group.id,
            "location": location.id,
            "description": "Test subnet",
        }
        response = authenticated_api_client.post("/api/v1/ipam/subnets/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["network"] == "192.168.1.0/24"
        assert response.data["is_ipv6"] is False

    def test_create_subnet_ipv6(self, authenticated_api_client):
        """Test that authenticated user can create an IPv6 subnet."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        data = {
            "network": "2001:db8::/32",
            "group": group.id,
            "location": location.id,
        }
        response = authenticated_api_client.post("/api/v1/ipam/subnets/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["is_ipv6"] is True

    def test_create_subnet_invalid_cidr_fails(self, authenticated_api_client):
        """Test that creating a subnet with invalid CIDR fails."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        data = {
            "network": "invalid-cidr",
            "group": group.id,
            "location": location.id,
        }
        response = authenticated_api_client.post("/api/v1/ipam/subnets/", data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_retrieve_subnet_success(self, authenticated_api_client):
        """Test that authenticated user can retrieve a subnet."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        subnet = Subnet.objects.create(network="192.168.1.0/24", group=group, location=location)
        response = authenticated_api_client.get(f"/api/v1/ipam/subnets/{subnet.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["network"] == "192.168.1.0/24"

    def test_subnet_child_subnets_action(self, authenticated_api_client):
        """Test the child_subnets custom action."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        master = Subnet.objects.create(network="192.168.0.0/16", group=group, location=location)
        child1 = Subnet.objects.create(
            network="192.168.1.0/24",
            group=group,
            location=location,
            master_subnet=master,
        )
        child2 = Subnet.objects.create(
            network="192.168.2.0/24",
            group=group,
            location=location,
            master_subnet=master,
        )

        response = authenticated_api_client.get(f"/api/v1/ipam/subnets/{master.id}/child_subnets/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        child_ids = [c["id"] for c in response.data]
        assert child1.id in child_ids
        assert child2.id in child_ids

    def test_subnet_ip_addresses_action(self, authenticated_api_client):
        """Test the ip_addresses custom action."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        subnet = Subnet.objects.create(network="192.168.1.0/24", group=group, location=location)
        ip1 = IPAddress.objects.create(address="192.168.1.1", subnet=subnet)
        ip2 = IPAddress.objects.create(address="192.168.1.2", subnet=subnet)

        response = authenticated_api_client.get(f"/api/v1/ipam/subnets/{subnet.id}/ip_addresses/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
        ip_ids = [ip["id"] for ip in response.data]
        assert ip1.id in ip_ids
        assert ip2.id in ip_ids

    def test_delete_subnet_success(self, authenticated_api_client):
        """Test that authenticated user can delete a subnet."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        subnet = Subnet.objects.create(network="192.168.1.0/24", group=group, location=location)
        response = authenticated_api_client.delete(f"/api/v1/ipam/subnets/{subnet.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Subnet.objects.filter(id=subnet.id).exists()


@pytest.mark.api
@pytest.mark.django_db
class TestIPAddressViewSet:
    """Test cases for IPAddressViewSet."""

    def test_list_ip_addresses_requires_authentication(self, api_client):
        """Test that listing IP addresses requires authentication."""
        response = api_client.get("/api/v1/ipam/ip-addresses/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_ip_addresses_success(self, authenticated_api_client):
        """Test that authenticated user can list IP addresses."""
        IPAddress.objects.create(address="192.168.1.1")
        IPAddress.objects.create(address="192.168.1.2")

        response = authenticated_api_client.get("/api/v1/ipam/ip-addresses/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 2

    def test_create_ip_address_success(self, authenticated_api_client):
        """Test that authenticated user can create an IP address."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        subnet = Subnet.objects.create(network="192.168.1.0/24", group=group, location=location)
        data = {
            "address": "192.168.1.10",
            "subnet": subnet.id,
            "status": "assigned",
            "description": "Test IP",
        }
        response = authenticated_api_client.post("/api/v1/ipam/ip-addresses/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["address"] == "192.168.1.10"
        assert response.data["status"] == "assigned"

    def test_create_ip_address_duplicate_fails(self, authenticated_api_client):
        """Test that creating duplicate IP address fails."""
        IPAddress.objects.create(address="192.168.1.1")
        data = {"address": "192.168.1.1"}
        response = authenticated_api_client.post("/api/v1/ipam/ip-addresses/", data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_ip_address_nested_route(self, authenticated_api_client):
        """Test creating IP address via nested route."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        subnet = Subnet.objects.create(network="192.168.1.0/24", group=group, location=location)
        data = {"address": "192.168.1.10", "status": "assigned"}
        response = authenticated_api_client.post(
            f"/api/v1/ipam/subnets/{subnet.id}/ip-addresses/", data, format="json"
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["address"] == "192.168.1.10"
        # Subnet ID might be returned as int or string, so convert for comparison
        assert int(response.data["subnet"]) == subnet.id

    def test_list_ip_addresses_nested_route(self, authenticated_api_client):
        """Test listing IP addresses via nested route."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        subnet = Subnet.objects.create(network="192.168.1.0/24", group=group, location=location)
        IPAddress.objects.create(address="192.168.1.1", subnet=subnet)
        IPAddress.objects.create(address="192.168.1.2", subnet=subnet)
        # Create IP in different subnet
        subnet2 = Subnet.objects.create(network="192.168.2.0/24", group=group, location=location)
        IPAddress.objects.create(address="192.168.2.1", subnet=subnet2)

        response = authenticated_api_client.get(f"/api/v1/ipam/subnets/{subnet.id}/ip-addresses/")
        assert response.status_code == status.HTTP_200_OK
        # Nested routers may return list directly or paginated response
        if isinstance(response.data, list):
            assert len(response.data) == 2
        else:
            assert response.data["count"] == 2

    def test_retrieve_ip_address_success(self, authenticated_api_client):
        """Test that authenticated user can retrieve an IP address."""
        ip = IPAddress.objects.create(address="192.168.1.1")
        response = authenticated_api_client.get(f"/api/v1/ipam/ip-addresses/{ip.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["address"] == "192.168.1.1"

    def test_update_ip_address_success(self, authenticated_api_client):
        """Test that authenticated user can update an IP address."""
        ip = IPAddress.objects.create(address="192.168.1.1", status="available")
        data = {"address": "192.168.1.1", "status": "assigned", "description": "Updated"}
        response = authenticated_api_client.put(
            f"/api/v1/ipam/ip-addresses/{ip.id}/", data, format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "assigned"

    def test_delete_ip_address_success(self, authenticated_api_client):
        """Test that authenticated user can delete an IP address."""
        ip = IPAddress.objects.create(address="192.168.1.1")
        response = authenticated_api_client.delete(f"/api/v1/ipam/ip-addresses/{ip.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not IPAddress.objects.filter(id=ip.id).exists()


@pytest.mark.api
@pytest.mark.django_db
class TestDNSZoneViewSet:
    """Test cases for DNSZoneViewSet."""

    def test_list_dns_zones_requires_authentication(self, api_client):
        """Test that listing DNS zones requires authentication."""
        response = api_client.get("/api/v1/ipam/dns-zones/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_dns_zones_success(self, authenticated_api_client):
        """Test that authenticated user can list DNS zones."""
        DNSZone.objects.create(name="example.com")
        DNSZone.objects.create(name="test.com")

        response = authenticated_api_client.get("/api/v1/ipam/dns-zones/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 2

    def test_create_dns_zone_success(self, authenticated_api_client):
        """Test that authenticated user can create a DNS zone."""
        data = {"name": "newzone.com", "description": "Test zone"}
        response = authenticated_api_client.post("/api/v1/ipam/dns-zones/", data, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "newzone.com"

    def test_create_duplicate_dns_zone_fails(self, authenticated_api_client):
        """Test that creating duplicate DNS zone name fails."""
        DNSZone.objects.create(name="example.com")
        data = {"name": "example.com"}
        response = authenticated_api_client.post("/api/v1/ipam/dns-zones/", data, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_dns_zone_records_action(self, authenticated_api_client):
        """Test the records nested route (replaces custom action)."""
        zone = DNSZone.objects.create(name="example.com")
        DNSRecord.objects.create(zone=zone, name="www", record_type="A", value="192.168.1.1")
        DNSRecord.objects.create(
            zone=zone, name="mail", record_type="MX", value="10 mail.example.com"
        )

        response = authenticated_api_client.get(f"/api/v1/ipam/dns-zones/{zone.id}/records/")
        assert response.status_code == status.HTTP_200_OK
        # Nested routers may return list directly or paginated response
        if isinstance(response.data, list):
            assert len(response.data) == 2
        else:
            assert response.data["count"] == 2

    def test_retrieve_dns_zone_success(self, authenticated_api_client):
        """Test that authenticated user can retrieve a DNS zone."""
        zone = DNSZone.objects.create(name="example.com")
        response = authenticated_api_client.get(f"/api/v1/ipam/dns-zones/{zone.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "example.com"

    def test_delete_dns_zone_success(self, authenticated_api_client):
        """Test that authenticated user can delete a DNS zone."""
        zone = DNSZone.objects.create(name="example.com")
        response = authenticated_api_client.delete(f"/api/v1/ipam/dns-zones/{zone.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not DNSZone.objects.filter(id=zone.id).exists()


@pytest.mark.api
@pytest.mark.django_db
class TestDNSRecordViewSet:
    """Test cases for DNSRecordViewSet."""

    def test_list_dns_records_requires_authentication(self, api_client):
        """Test that listing DNS records requires authentication."""
        response = api_client.get("/api/v1/ipam/dns-records/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_dns_records_success(self, authenticated_api_client):
        """Test that authenticated user can list DNS records."""
        zone = DNSZone.objects.create(name="example.com")
        DNSRecord.objects.create(zone=zone, name="www", record_type="A", value="192.168.1.1")
        DNSRecord.objects.create(
            zone=zone, name="mail", record_type="MX", value="10 mail.example.com"
        )

        response = authenticated_api_client.get("/api/v1/ipam/dns-records/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 2

    def test_create_dns_record_success(self, authenticated_api_client):
        """Test that authenticated user can create a DNS record."""
        zone = DNSZone.objects.create(name="example.com")
        data = {
            "name": "www",
            "record_type": "A",
            "value": "192.168.1.1",
            "ttl": 3600,
        }
        response = authenticated_api_client.post(
            f"/api/v1/ipam/dns-zones/{zone.id}/records/", data, format="json"
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "www"
        assert response.data["record_type"] == "A"

    def test_create_dns_record_nested_route(self, authenticated_api_client):
        """Test creating DNS record via nested route."""
        zone = DNSZone.objects.create(name="example.com")
        data = {
            "name": "www",
            "record_type": "A",
            "value": "192.168.1.1",
            "ttl": 3600,
        }
        response = authenticated_api_client.post(
            f"/api/v1/ipam/dns-zones/{zone.id}/records/", data, format="json"
        )
        if response.status_code != status.HTTP_201_CREATED:
            # Print error details for debugging
            print(f"Response status: {response.status_code}")
            print(f"Response data: {response.data}")
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["name"] == "www"
        assert response.data["zone"] == zone.id

    def test_list_dns_records_nested_route(self, authenticated_api_client):
        """Test listing DNS records via nested route."""
        zone1 = DNSZone.objects.create(name="example.com")
        zone2 = DNSZone.objects.create(name="test.com")
        DNSRecord.objects.create(zone=zone1, name="www", record_type="A", value="192.168.1.1")
        DNSRecord.objects.create(
            zone=zone1, name="mail", record_type="MX", value="10 mail.example.com"
        )
        DNSRecord.objects.create(zone=zone2, name="www", record_type="A", value="192.168.2.1")

        response = authenticated_api_client.get(f"/api/v1/ipam/dns-zones/{zone1.id}/records/")
        assert response.status_code == status.HTTP_200_OK
        # Nested routers may return list directly or paginated response
        if isinstance(response.data, list):
            assert len(response.data) == 2
        else:
            assert response.data["count"] == 2

    def test_create_duplicate_dns_record_fails(self, authenticated_api_client):
        """Test that creating duplicate DNS record fails."""
        zone = DNSZone.objects.create(name="example.com")
        DNSRecord.objects.create(zone=zone, name="www", record_type="A", value="192.168.1.1")
        data = {
            "name": "www",
            "record_type": "A",
            "value": "192.168.1.2",
        }
        response = authenticated_api_client.post(
            f"/api/v1/ipam/dns-zones/{zone.id}/records/", data, format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_retrieve_dns_record_success(self, authenticated_api_client):
        """Test that authenticated user can retrieve a DNS record."""
        zone = DNSZone.objects.create(name="example.com")
        record = DNSRecord.objects.create(
            zone=zone, name="www", record_type="A", value="192.168.1.1"
        )
        response = authenticated_api_client.get(f"/api/v1/ipam/dns-records/{record.id}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["name"] == "www"

    def test_update_dns_record_success(self, authenticated_api_client):
        """Test that authenticated user can update a DNS record."""
        zone = DNSZone.objects.create(name="example.com")
        record = DNSRecord.objects.create(
            zone=zone, name="www", record_type="A", value="192.168.1.1"
        )
        data = {
            "zone": zone.id,
            "name": "www",
            "record_type": "A",
            "value": "192.168.1.2",
            "ttl": 7200,
        }
        response = authenticated_api_client.put(
            f"/api/v1/ipam/dns-records/{record.id}/", data, format="json"
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["value"] == "192.168.1.2"
        assert response.data["ttl"] == 7200

    def test_delete_dns_record_success(self, authenticated_api_client):
        """Test that authenticated user can delete a DNS record."""
        zone = DNSZone.objects.create(name="example.com")
        record = DNSRecord.objects.create(
            zone=zone, name="www", record_type="A", value="192.168.1.1"
        )
        response = authenticated_api_client.delete(f"/api/v1/ipam/dns-records/{record.id}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not DNSRecord.objects.filter(id=record.id).exists()
