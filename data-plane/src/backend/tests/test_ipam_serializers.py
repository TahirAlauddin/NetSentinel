"""
Tests for IPAM serializers.
"""

import pytest

from infrastructure.models import Location
from ipam.models import (
    Customer,
    DNSRecord,
    DNSZone,
    IPAddress,
    Subnet,
    SubnetGroup,
    VLAN,
    VRF,
)
from ipam.serializers import (
    CustomerSerializer,
    DNSRecordSerializer,
    DNSZoneSerializer,
    IPAddressSerializer,
    SubnetGroupSerializer,
    SubnetSerializer,
    VLANSerializer,
    VRFSerializer,
)


@pytest.mark.django_db
class TestCustomerSerializer:
    """Test cases for CustomerSerializer."""

    def test_customer_serializer_serialization(self):
        """Test that CustomerSerializer correctly serializes a customer."""
        customer = Customer.objects.create(
            name="Test Customer",
            description="Test description",
            contact_email="test@example.com",
            contact_phone="555-1234",
        )
        serializer = CustomerSerializer(customer)
        data = serializer.data

        assert data["id"] == customer.id
        assert data["name"] == "Test Customer"
        assert data["description"] == "Test description"
        assert data["contact_email"] == "test@example.com"
        assert data["contact_phone"] == "555-1234"
        assert "created_at" in data
        assert "updated_at" in data

    def test_customer_serializer_create(self):
        """Test creating a customer via serializer."""
        data = {
            "name": "New Customer",
            "description": "New description",
            "contact_email": "new@example.com",
        }
        serializer = CustomerSerializer(data=data)
        assert serializer.is_valid()
        customer = serializer.save()
        assert customer.name == "New Customer"
        assert customer.contact_email == "new@example.com"

    def test_customer_serializer_update(self):
        """Test updating a customer via serializer."""
        customer = Customer.objects.create(name="Old Name")
        data = {"name": "New Name", "contact_email": "new@example.com"}
        serializer = CustomerSerializer(customer, data=data, partial=True)
        assert serializer.is_valid()
        serializer.save()
        customer.refresh_from_db()
        assert customer.name == "New Name"
        assert customer.contact_email == "new@example.com"


@pytest.mark.django_db
class TestSubnetGroupSerializer:
    """Test cases for SubnetGroupSerializer."""

    def test_subnet_group_serializer_serialization(self):
        """Test that SubnetGroupSerializer correctly serializes a subnet group."""
        group = SubnetGroup.objects.create(name="Test Group", description="Test description")
        serializer = SubnetGroupSerializer(group)
        data = serializer.data

        assert data["id"] == group.id
        assert data["name"] == "Test Group"
        assert data["description"] == "Test description"
        assert "created_at" in data
        assert "updated_at" in data

    def test_subnet_group_serializer_create(self):
        """Test creating a subnet group via serializer."""
        data = {"name": "New Group", "description": "New description"}
        serializer = SubnetGroupSerializer(data=data)
        assert serializer.is_valid()
        group = serializer.save()
        assert group.name == "New Group"
        assert group.description == "New description"


@pytest.mark.django_db
class TestVLANSerializer:
    """Test cases for VLANSerializer."""

    def test_vlan_serializer_serialization(self):
        """Test that VLANSerializer correctly serializes a VLAN."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        vlan = VLAN.objects.create(
            vlan_id=100, name="Test VLAN", location=location, description="Test"
        )
        serializer = VLANSerializer(vlan)
        data = serializer.data

        assert data["id"] == vlan.id
        assert data["vlan_id"] == 100
        assert data["name"] == "Test VLAN"
        assert data["location"] == location.id
        assert data["description"] == "Test"
        assert "created_at" in data
        assert "updated_at" in data

    def test_vlan_serializer_create(self):
        """Test creating a VLAN via serializer."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        data = {
            "vlan_id": 200,
            "name": "New VLAN",
            "location": location.id,
            "description": "New description",
        }
        serializer = VLANSerializer(data=data)
        assert serializer.is_valid()
        vlan = serializer.save()
        assert vlan.vlan_id == 200
        assert vlan.name == "New VLAN"
        assert vlan.location == location


@pytest.mark.django_db
class TestVRFSerializer:
    """Test cases for VRFSerializer."""

    def test_vrf_serializer_serialization(self):
        """Test that VRFSerializer correctly serializes a VRF."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        vrf = VRF.objects.create(
            name="Test VRF", rd="65000:100", location=location, description="Test"
        )
        serializer = VRFSerializer(vrf)
        data = serializer.data

        assert data["id"] == vrf.id
        assert data["name"] == "Test VRF"
        assert data["rd"] == "65000:100"
        assert data["location"] == location.id
        assert data["description"] == "Test"
        assert "created_at" in data
        assert "updated_at" in data

    def test_vrf_serializer_create(self):
        """Test creating a VRF via serializer."""
        data = {"name": "New VRF", "rd": "65000:200", "description": "New description"}
        serializer = VRFSerializer(data=data)
        assert serializer.is_valid()
        vrf = serializer.save()
        assert vrf.name == "New VRF"
        assert vrf.rd == "65000:200"


@pytest.mark.django_db
class TestSubnetSerializer:
    """Test cases for SubnetSerializer."""

    def test_subnet_serializer_serialization(self):
        """Test that SubnetSerializer correctly serializes a subnet."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        subnet = Subnet.objects.create(
            network="192.168.1.0/24",
            group=group,
            location=location,
            description="Test subnet",
        )
        serializer = SubnetSerializer(subnet)
        data = serializer.data

        assert data["id"] == subnet.id
        assert data["network"] == "192.168.1.0/24"
        assert data["group"] == group.id
        assert data["location"] == location.id
        assert data["description"] == "Test subnet"
        assert data["is_ipv6"] is False
        assert data["status"] == "active"
        assert "group_detail" in data
        assert "location_detail" in data
        assert "child_subnets_count" in data
        assert "ip_addresses_count" in data
        assert data["child_subnets_count"] == 0
        assert data["ip_addresses_count"] == 0

    def test_subnet_serializer_with_relationships(self):
        """Test that SubnetSerializer includes relationship details."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        vlan = VLAN.objects.create(vlan_id=100, name="Test VLAN", location=location)
        vrf = VRF.objects.create(name="Test VRF", location=location)
        customer = Customer.objects.create(name="Test Customer")
        subnet = Subnet.objects.create(
            network="192.168.1.0/24",
            group=group,
            location=location,
            vlan=vlan,
            vrf=vrf,
            customer=customer,
        )
        serializer = SubnetSerializer(subnet)
        data = serializer.data

        assert data["vlan"] == vlan.id
        assert data["vrf"] == vrf.id
        assert data["customer"] == customer.id
        assert "vlan_detail" in data
        assert "vrf_detail" in data
        assert "customer_detail" in data

    def test_subnet_serializer_master_subnet_detail(self):
        """Test that master_subnet_detail is correctly serialized."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        master = Subnet.objects.create(network="192.168.0.0/16", group=group, location=location)
        child = Subnet.objects.create(
            network="192.168.1.0/24",
            group=group,
            location=location,
            master_subnet=master,
        )
        serializer = SubnetSerializer(child)
        data = serializer.data

        assert data["master_subnet"] == master.id
        assert "master_subnet_detail" in data
        assert data["master_subnet_detail"]["id"] == master.id
        assert data["master_subnet_detail"]["network"] == "192.168.0.0/16"

    def test_subnet_serializer_child_subnets_count(self):
        """Test that child_subnets_count is correctly calculated."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        master = Subnet.objects.create(network="192.168.0.0/16", group=group, location=location)
        Subnet.objects.create(
            network="192.168.1.0/24",
            group=group,
            location=location,
            master_subnet=master,
        )
        Subnet.objects.create(
            network="192.168.2.0/24",
            group=group,
            location=location,
            master_subnet=master,
        )

        serializer = SubnetSerializer(master)
        data = serializer.data
        assert data["child_subnets_count"] == 2

    def test_subnet_serializer_ip_addresses_count(self):
        """Test that ip_addresses_count is correctly calculated."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        subnet = Subnet.objects.create(network="192.168.1.0/24", group=group, location=location)
        IPAddress.objects.create(address="192.168.1.1", subnet=subnet)
        IPAddress.objects.create(address="192.168.1.2", subnet=subnet)

        serializer = SubnetSerializer(subnet)
        data = serializer.data
        assert data["ip_addresses_count"] == 2

    def test_subnet_serializer_create(self):
        """Test creating a subnet via serializer."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        data = {
            "network": "192.168.2.0/24",
            "group": group.id,
            "location": location.id,
            "description": "New subnet",
        }
        serializer = SubnetSerializer(data=data)
        assert serializer.is_valid(), f"Serializer errors: {serializer.errors}"
        subnet = serializer.save()
        assert subnet.network == "192.168.2.0/24"
        assert subnet.group == group
        assert subnet.location == location

    def test_subnet_serializer_ipv6(self):
        """Test that IPv6 subnets are correctly serialized."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        subnet = Subnet.objects.create(network="2001:db8::/32", group=group, location=location)
        # Refresh to ensure is_ipv6 is set by model's save() method
        subnet.refresh_from_db()
        serializer = SubnetSerializer(subnet)
        data = serializer.data
        assert data["is_ipv6"] is True


@pytest.mark.django_db
class TestIPAddressSerializer:
    """Test cases for IPAddressSerializer."""

    def test_ip_address_serializer_serialization(self):
        """Test that IPAddressSerializer correctly serializes an IP address."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        subnet = Subnet.objects.create(network="192.168.1.0/24", group=group, location=location)
        ip = IPAddress.objects.create(
            address="192.168.1.1", subnet=subnet, status="assigned", description="Test"
        )
        serializer = IPAddressSerializer(ip)
        data = serializer.data

        assert data["id"] == ip.id
        assert data["address"] == "192.168.1.1"
        assert data["subnet"] == subnet.id
        assert data["status"] == "assigned"
        assert data["description"] == "Test"
        assert "subnet_detail" in data
        assert "status_display" in data
        assert "created_at" in data
        assert "updated_at" in data

    def test_ip_address_serializer_subnet_detail(self):
        """Test that subnet_detail is correctly serialized."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        subnet = Subnet.objects.create(network="192.168.1.0/24", group=group, location=location)
        ip = IPAddress.objects.create(address="192.168.1.1", subnet=subnet)
        serializer = IPAddressSerializer(ip)
        data = serializer.data

        assert "subnet_detail" in data
        assert data["subnet_detail"]["id"] == subnet.id
        assert data["subnet_detail"]["network"] == "192.168.1.0/24"

    def test_ip_address_serializer_status_display(self):
        """Test that status_display is correctly serialized."""
        ip = IPAddress.objects.create(address="192.168.1.1", status="assigned")
        serializer = IPAddressSerializer(ip)
        data = serializer.data
        assert data["status"] == "assigned"
        assert data["status_display"] == "Assigned"

    def test_ip_address_serializer_create(self):
        """Test creating an IP address via serializer."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        subnet = Subnet.objects.create(network="192.168.1.0/24", group=group, location=location)
        data = {
            "address": "192.168.1.10",
            "subnet": subnet.id,
            "status": "reserved",
            "description": "New IP",
        }
        serializer = IPAddressSerializer(data=data)
        assert serializer.is_valid()
        ip = serializer.save()
        assert ip.address == "192.168.1.10"
        assert ip.subnet == subnet
        assert ip.status == "reserved"

    def test_ip_address_serializer_ipv6(self):
        """Test that IPv6 addresses are correctly serialized."""
        ip = IPAddress.objects.create(address="2001:db8::1")
        serializer = IPAddressSerializer(ip)
        data = serializer.data
        assert data["address"] == "2001:db8::1"


@pytest.mark.django_db
class TestDNSZoneSerializer:
    """Test cases for DNSZoneSerializer."""

    def test_dns_zone_serializer_serialization(self):
        """Test that DNSZoneSerializer correctly serializes a DNS zone."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        zone = DNSZone.objects.create(
            name="example.com", location=location, description="Test zone"
        )
        serializer = DNSZoneSerializer(zone)
        data = serializer.data

        assert data["id"] == zone.id
        assert data["name"] == "example.com"
        assert data["location"] == location.id
        assert data["description"] == "Test zone"
        assert "created_at" in data
        assert "updated_at" in data

    def test_dns_zone_serializer_create(self):
        """Test creating a DNS zone via serializer."""
        data = {"name": "newzone.com", "description": "New zone"}
        serializer = DNSZoneSerializer(data=data)
        assert serializer.is_valid()
        zone = serializer.save()
        assert zone.name == "newzone.com"
        assert zone.description == "New zone"


@pytest.mark.django_db
class TestDNSRecordSerializer:
    """Test cases for DNSRecordSerializer."""

    def test_dns_record_serializer_serialization(self):
        """Test that DNSRecordSerializer correctly serializes a DNS record."""
        zone = DNSZone.objects.create(name="example.com")
        record = DNSRecord.objects.create(
            zone=zone,
            name="www",
            record_type="A",
            value="192.168.1.1",
            ttl=3600,
            description="Test record",
        )
        serializer = DNSRecordSerializer(record)
        data = serializer.data

        assert data["id"] == record.id
        assert data["zone"] == zone.id
        assert data["name"] == "www"
        assert data["record_type"] == "A"
        assert data["value"] == "192.168.1.1"
        assert data["ttl"] == 3600
        assert data["description"] == "Test record"
        assert "created_at" in data
        assert "updated_at" in data

    def test_dns_record_serializer_create(self):
        """Test creating a DNS record via serializer."""
        zone = DNSZone.objects.create(name="example.com")
        data = {
            "name": "mail",
            "record_type": "MX",
            "value": "10 mail.example.com",
            "ttl": 7200,
        }
        serializer = DNSRecordSerializer(data=data)
        serializer.context["zone_pk"] = zone.id
        assert serializer.is_valid()
        record = serializer.save()
        assert record.name == "mail"
        assert record.record_type == "MX"
        assert record.value == "10 mail.example.com"
        assert record.ttl == 7200
        assert record.zone == zone

    def test_dns_record_serializer_all_record_types(self):
        """Test that all DNS record types are correctly serialized."""
        zone = DNSZone.objects.create(name="example.com")
        record_types = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "PTR", "SRV"]
        for record_type in record_types:
            record = DNSRecord.objects.create(
                zone=zone,
                name=f"test_{record_type.lower()}",
                record_type=record_type,
                value="test",
            )
            serializer = DNSRecordSerializer(record)
            data = serializer.data
            assert data["record_type"] == record_type
