"""
Tests for IPAM models.
"""

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError

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


@pytest.mark.django_db
class TestCustomerModel:
    """Test cases for Customer model."""

    def test_customer_creation(self):
        """Test that a customer can be created with required fields."""
        customer = Customer.objects.create(name="Test Customer")
        assert customer.name == "Test Customer"
        assert customer.description is None
        assert customer.contact_email is None
        assert customer.contact_phone is None

    def test_customer_str_representation(self):
        """Test customer string representation."""
        customer = Customer.objects.create(name="Test Customer")
        assert str(customer) == "Test Customer"

    def test_customer_optional_fields(self):
        """Test that optional fields can be set."""
        customer = Customer.objects.create(
            name="Test Customer",
            description="Test description",
            contact_email="test@example.com",
            contact_phone="555-1234",
        )
        assert customer.description == "Test description"
        assert customer.contact_email == "test@example.com"
        assert customer.contact_phone == "555-1234"

    def test_customer_unique_email(self):
        """Test that customer email must be unique."""
        Customer.objects.create(name="Customer 1", contact_email="test@example.com")
        with pytest.raises(IntegrityError):
            Customer.objects.create(name="Customer 2", contact_email="test@example.com")

    def test_customer_ordering(self):
        """Test that customers are ordered by name."""
        Customer.objects.create(name="Z Customer")
        Customer.objects.create(name="A Customer")
        Customer.objects.create(name="M Customer")

        customers = list(Customer.objects.all())
        assert customers[0].name == "A Customer"
        assert customers[1].name == "M Customer"
        assert customers[2].name == "Z Customer"


@pytest.mark.django_db
class TestSubnetGroupModel:
    """Test cases for SubnetGroup model."""

    def test_subnet_group_creation(self):
        """Test that a subnet group can be created."""
        group = SubnetGroup.objects.create(name="Production Networks")
        assert group.name == "Production Networks"
        assert group.description is None

    def test_subnet_group_str_representation(self):
        """Test subnet group string representation."""
        group = SubnetGroup.objects.create(name="Production Networks")
        assert str(group) == "Production Networks"

    def test_subnet_group_unique_name(self):
        """Test that subnet group name must be unique."""
        SubnetGroup.objects.create(name="Production Networks")
        with pytest.raises(IntegrityError):
            SubnetGroup.objects.create(name="Production Networks")

    def test_subnet_group_optional_fields(self):
        """Test that optional fields can be set."""
        group = SubnetGroup.objects.create(name="Test Group", description="Test description")
        assert group.description == "Test description"

    def test_subnet_group_ordering(self):
        """Test that subnet groups are ordered by name."""
        SubnetGroup.objects.create(name="Z Group")
        SubnetGroup.objects.create(name="A Group")
        SubnetGroup.objects.create(name="M Group")

        groups = list(SubnetGroup.objects.all())
        assert groups[0].name == "A Group"
        assert groups[1].name == "M Group"
        assert groups[2].name == "Z Group"


@pytest.mark.django_db
class TestVLANModel:
    """Test cases for VLAN model."""

    def test_vlan_creation(self):
        """Test that a VLAN can be created with required fields."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        vlan = VLAN.objects.create(vlan_id=100, name="Test VLAN", location=location)
        assert vlan.vlan_id == 100
        assert vlan.name == "Test VLAN"
        assert vlan.location == location
        assert vlan.description is None

    def test_vlan_str_representation(self):
        """Test VLAN string representation."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        vlan = VLAN.objects.create(vlan_id=100, name="Test VLAN", location=location)
        assert "VLAN 100" in str(vlan)
        assert "Test VLAN" in str(vlan)

    def test_vlan_id_validation_min(self):
        """Test that VLAN ID must be at least 1."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        vlan = VLAN(vlan_id=0, name="Test VLAN", location=location)
        with pytest.raises(ValidationError):
            vlan.full_clean()

    def test_vlan_id_validation_max(self):
        """Test that VLAN ID must be at most 4094."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        vlan = VLAN(vlan_id=4095, name="Test VLAN", location=location)
        with pytest.raises(ValidationError):
            vlan.full_clean()

    def test_vlan_unique_together(self):
        """Test that vlan_id and location must be unique together."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        VLAN.objects.create(vlan_id=100, name="VLAN 1", location=location)
        # Try to create another VLAN with same ID and location
        with pytest.raises(IntegrityError):
            VLAN.objects.create(vlan_id=100, name="VLAN 2", location=location)

    def test_vlan_same_id_different_locations(self):
        """Test that same VLAN ID can exist in different locations."""
        location1 = Location.objects.create(
            name="Location 1", address1="123 Main St", city="City 1"
        )
        location2 = Location.objects.create(
            name="Location 2", address1="456 Oak Ave", city="City 2"
        )
        vlan1 = VLAN.objects.create(vlan_id=100, name="VLAN 1", location=location1)
        vlan2 = VLAN.objects.create(vlan_id=100, name="VLAN 2", location=location2)
        assert vlan1.vlan_id == vlan2.vlan_id
        assert vlan1.location != vlan2.location

    def test_vlan_location_cascade_delete(self):
        """Test that deleting a location deletes associated VLANs."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        vlan = VLAN.objects.create(vlan_id=100, name="Test VLAN", location=location)
        vlan_id = vlan.id
        location.delete()
        assert not VLAN.objects.filter(id=vlan_id).exists()

    def test_vlan_ordering(self):
        """Test that VLANs are ordered by vlan_id."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        VLAN.objects.create(vlan_id=300, name="VLAN 3", location=location)
        VLAN.objects.create(vlan_id=100, name="VLAN 1", location=location)
        VLAN.objects.create(vlan_id=200, name="VLAN 2", location=location)

        vlans = list(VLAN.objects.all())
        assert vlans[0].vlan_id == 100
        assert vlans[1].vlan_id == 200
        assert vlans[2].vlan_id == 300


@pytest.mark.django_db
class TestVRFModel:
    """Test cases for VRF model."""

    def test_vrf_creation(self):
        """Test that a VRF can be created with required fields."""
        vrf = VRF.objects.create(name="Test VRF")
        assert vrf.name == "Test VRF"
        assert vrf.rd is None
        assert vrf.description is None
        assert vrf.location is None

    def test_vrf_str_representation_without_rd(self):
        """Test VRF string representation without RD."""
        vrf = VRF.objects.create(name="Test VRF")
        assert str(vrf) == "Test VRF"

    def test_vrf_str_representation_with_rd(self):
        """Test VRF string representation with RD."""
        vrf = VRF.objects.create(name="Test VRF", rd="65000:100")
        assert "Test VRF" in str(vrf)
        assert "RD: 65000:100" in str(vrf)

    def test_vrf_with_location(self):
        """Test that VRF can be associated with a location."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        vrf = VRF.objects.create(name="Test VRF", location=location)
        assert vrf.location == location

    def test_vrf_unique_together(self):
        """Test that name and location must be unique together."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        VRF.objects.create(name="Test VRF", location=location)
        # Try to create another VRF with same name and location
        with pytest.raises(IntegrityError):
            VRF.objects.create(name="Test VRF", location=location)

    def test_vrf_same_name_different_locations(self):
        """Test that same VRF name can exist in different locations."""
        location1 = Location.objects.create(
            name="Location 1", address1="123 Main St", city="City 1"
        )
        location2 = Location.objects.create(
            name="Location 2", address1="456 Oak Ave", city="City 2"
        )
        vrf1 = VRF.objects.create(name="Test VRF", location=location1)
        vrf2 = VRF.objects.create(name="Test VRF", location=location2)
        assert vrf1.name == vrf2.name
        assert vrf1.location != vrf2.location

    def test_vrf_ordering(self):
        """Test that VRFs are ordered by name."""
        VRF.objects.create(name="Z VRF")
        VRF.objects.create(name="A VRF")
        VRF.objects.create(name="M VRF")

        vrfs = list(VRF.objects.all())
        assert vrfs[0].name == "A VRF"
        assert vrfs[1].name == "M VRF"
        assert vrfs[2].name == "Z VRF"


@pytest.mark.django_db
class TestSubnetModel:
    """Test cases for Subnet model."""

    def test_subnet_creation(self):
        """Test that a subnet can be created with required fields."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        subnet = Subnet.objects.create(network="192.168.1.0/24", group=group, location=location)
        assert subnet.network == "192.168.1.0/24"
        assert subnet.group == group
        assert subnet.location == location
        assert subnet.is_ipv6 is False
        assert subnet.status == "active"

    def test_subnet_str_representation(self):
        """Test subnet string representation."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        subnet = Subnet.objects.create(network="192.168.1.0/24", group=group, location=location)
        assert "192.168.1.0/24" in str(subnet)
        assert "Test Location" in str(subnet)

    def test_subnet_ipv6(self):
        """Test that IPv6 subnets are properly detected."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        subnet = Subnet.objects.create(network="2001:db8::/32", group=group, location=location)
        # Refresh to ensure is_ipv6 is set by model's save() method
        subnet.refresh_from_db()
        assert subnet.is_ipv6 is True

    def test_subnet_status_choices(self):
        """Test that subnet status must be a valid choice."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        subnet = Subnet.objects.create(
            network="192.168.1.0/24",
            group=group,
            location=location,
            status="planned",
        )
        assert subnet.status == "planned"

    def test_subnet_unique_together(self):
        """Test that network and location must be unique together."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        Subnet.objects.create(network="192.168.1.0/24", group=group, location=location)
        # Try to create another subnet with same network and location
        with pytest.raises(IntegrityError):
            Subnet.objects.create(network="192.168.1.0/24", group=group, location=location)

    def test_subnet_master_subnet_relationship(self):
        """Test that subnets can have master/child relationships."""
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
        assert child.master_subnet == master
        assert child in master.child_subnets.all()

    def test_subnet_with_vlan(self):
        """Test that subnet can be associated with a VLAN."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        vlan = VLAN.objects.create(vlan_id=100, name="Test VLAN", location=location)
        subnet = Subnet.objects.create(
            network="192.168.1.0/24", group=group, location=location, vlan=vlan
        )
        assert subnet.vlan == vlan

    def test_subnet_with_vrf(self):
        """Test that subnet can be associated with a VRF."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        vrf = VRF.objects.create(name="Test VRF", location=location)
        subnet = Subnet.objects.create(
            network="192.168.1.0/24", group=group, location=location, vrf=vrf
        )
        assert subnet.vrf == vrf

    def test_subnet_with_customer(self):
        """Test that subnet can be assigned to a customer."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        customer = Customer.objects.create(name="Test Customer")
        subnet = Subnet.objects.create(
            network="192.168.1.0/24",
            group=group,
            location=location,
            customer=customer,
        )
        assert subnet.customer == customer

    def test_subnet_ordering(self):
        """Test that subnets are ordered by network."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        Subnet.objects.create(network="192.168.3.0/24", group=group, location=location)
        Subnet.objects.create(network="192.168.1.0/24", group=group, location=location)
        Subnet.objects.create(network="192.168.2.0/24", group=group, location=location)

        subnets = list(Subnet.objects.all())
        assert subnets[0].network == "192.168.1.0/24"
        assert subnets[1].network == "192.168.2.0/24"
        assert subnets[2].network == "192.168.3.0/24"


@pytest.mark.django_db
class TestIPAddressModel:
    """Test cases for IPAddress model."""

    def test_ip_address_creation(self):
        """Test that an IP address can be created with required fields."""
        ip = IPAddress.objects.create(address="192.168.1.1")
        assert ip.address == "192.168.1.1"
        assert ip.subnet is None
        assert ip.status == "available"
        assert ip.description is None

    def test_ip_address_str_representation(self):
        """Test IP address string representation."""
        ip = IPAddress.objects.create(address="192.168.1.1")
        assert str(ip) == "192.168.1.1"

    def test_ip_address_unique(self):
        """Test that IP address must be unique."""
        IPAddress.objects.create(address="192.168.1.1")
        with pytest.raises(IntegrityError):
            IPAddress.objects.create(address="192.168.1.1")

    def test_ip_address_with_subnet(self):
        """Test that IP address can be associated with a subnet."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        subnet = Subnet.objects.create(network="192.168.1.0/24", group=group, location=location)
        ip = IPAddress.objects.create(address="192.168.1.1", subnet=subnet)
        assert ip.subnet == subnet

    def test_ip_address_status_choices(self):
        """Test that IP address status must be a valid choice."""
        ip1 = IPAddress.objects.create(address="192.168.1.1", status="available")
        ip2 = IPAddress.objects.create(address="192.168.1.2", status="reserved")
        ip3 = IPAddress.objects.create(address="192.168.1.3", status="assigned")
        ip4 = IPAddress.objects.create(address="192.168.1.4", status="dhcp")
        ip5 = IPAddress.objects.create(address="192.168.1.5", status="deprecated")
        assert ip1.status == "available"
        assert ip2.status == "reserved"
        assert ip3.status == "assigned"
        assert ip4.status == "dhcp"
        assert ip5.status == "deprecated"

    def test_ip_address_ipv6(self):
        """Test that IPv6 addresses are supported."""
        ip = IPAddress.objects.create(address="2001:db8::1")
        assert ip.address == "2001:db8::1"

    def test_ip_address_subnet_cascade_delete(self):
        """Test that deleting a subnet deletes associated IP addresses."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        group = SubnetGroup.objects.create(name="Test Group")
        subnet = Subnet.objects.create(network="192.168.1.0/24", group=group, location=location)
        ip = IPAddress.objects.create(address="192.168.1.1", subnet=subnet)
        ip_id = ip.id
        subnet.delete()
        assert not IPAddress.objects.filter(id=ip_id).exists()

    def test_ip_address_ordering(self):
        """Test that IP addresses are ordered by address."""
        IPAddress.objects.create(address="192.168.1.3")
        IPAddress.objects.create(address="192.168.1.1")
        IPAddress.objects.create(address="192.168.1.2")

        ips = list(IPAddress.objects.all())
        assert ips[0].address == "192.168.1.1"
        assert ips[1].address == "192.168.1.2"
        assert ips[2].address == "192.168.1.3"


@pytest.mark.django_db
class TestDNSZoneModel:
    """Test cases for DNSZone model."""

    def test_dns_zone_creation(self):
        """Test that a DNS zone can be created with required fields."""
        zone = DNSZone.objects.create(name="example.com")
        assert zone.name == "example.com"
        assert zone.description is None
        assert zone.location is None

    def test_dns_zone_str_representation(self):
        """Test DNS zone string representation."""
        zone = DNSZone.objects.create(name="example.com")
        assert str(zone) == "example.com"

    def test_dns_zone_unique_name(self):
        """Test that DNS zone name must be unique."""
        DNSZone.objects.create(name="example.com")
        with pytest.raises(IntegrityError):
            DNSZone.objects.create(name="example.com")

    def test_dns_zone_with_location(self):
        """Test that DNS zone can be associated with a location."""
        location = Location.objects.create(
            name="Test Location", address1="123 Main St", city="Test City"
        )
        zone = DNSZone.objects.create(name="example.com", location=location)
        assert zone.location == location

    def test_dns_zone_ordering(self):
        """Test that DNS zones are ordered by name."""
        DNSZone.objects.create(name="z.example.com")
        DNSZone.objects.create(name="a.example.com")
        DNSZone.objects.create(name="m.example.com")

        zones = list(DNSZone.objects.all())
        assert zones[0].name == "a.example.com"
        assert zones[1].name == "m.example.com"
        assert zones[2].name == "z.example.com"


@pytest.mark.django_db
class TestDNSRecordModel:
    """Test cases for DNSRecord model."""

    def test_dns_record_creation(self):
        """Test that a DNS record can be created with required fields."""
        zone = DNSZone.objects.create(name="example.com")
        record = DNSRecord.objects.create(
            zone=zone, name="www", record_type="A", value="192.168.1.1"
        )
        assert record.zone == zone
        assert record.name == "www"
        assert record.record_type == "A"
        assert record.value == "192.168.1.1"
        assert record.ttl == 3600
        assert record.description is None

    def test_dns_record_str_representation(self):
        """Test DNS record string representation."""
        zone = DNSZone.objects.create(name="example.com")
        record = DNSRecord.objects.create(
            zone=zone, name="www", record_type="A", value="192.168.1.1"
        )
        assert "www.example.com" in str(record)
        assert "A" in str(record)

    def test_dns_record_type_choices(self):
        """Test that record_type must be a valid choice."""
        zone = DNSZone.objects.create(name="example.com")
        record_types = ["A", "AAAA", "CNAME", "MX", "TXT", "NS", "PTR", "SRV"]
        for record_type in record_types:
            record = DNSRecord.objects.create(
                zone=zone,
                name=f"test_{record_type.lower()}",
                record_type=record_type,
                value="test",
            )
            assert record.record_type == record_type

    def test_dns_record_unique_together(self):
        """Test that zone, name, and record_type must be unique together."""
        zone = DNSZone.objects.create(name="example.com")
        DNSRecord.objects.create(zone=zone, name="www", record_type="A", value="192.168.1.1")
        # Try to create another record with same zone, name, and type
        with pytest.raises(IntegrityError):
            DNSRecord.objects.create(zone=zone, name="www", record_type="A", value="192.168.1.2")

    def test_dns_record_same_name_different_types(self):
        """Test that same name can exist with different record types."""
        zone = DNSZone.objects.create(name="example.com")
        record_a = DNSRecord.objects.create(
            zone=zone, name="www", record_type="A", value="192.168.1.1"
        )
        record_aaaa = DNSRecord.objects.create(
            zone=zone, name="www", record_type="AAAA", value="2001:db8::1"
        )
        assert record_a.name == record_aaaa.name
        assert record_a.record_type != record_aaaa.record_type

    def test_dns_record_zone_cascade_delete(self):
        """Test that deleting a zone deletes associated records."""
        zone = DNSZone.objects.create(name="example.com")
        record = DNSRecord.objects.create(
            zone=zone, name="www", record_type="A", value="192.168.1.1"
        )
        record_id = record.id
        zone.delete()
        assert not DNSRecord.objects.filter(id=record_id).exists()

    def test_dns_record_ordering(self):
        """Test that DNS records are ordered by zone, name, and record_type."""
        zone = DNSZone.objects.create(name="example.com")
        DNSRecord.objects.create(zone=zone, name="z", record_type="A", value="192.168.1.1")
        DNSRecord.objects.create(zone=zone, name="a", record_type="A", value="192.168.1.2")
        DNSRecord.objects.create(zone=zone, name="a", record_type="AAAA", value="2001:db8::1")

        records = list(DNSRecord.objects.all())
        assert records[0].name == "a"
        assert records[0].record_type == "A"
        assert records[1].name == "a"
        assert records[1].record_type == "AAAA"
        assert records[2].name == "z"
