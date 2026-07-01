"""
Seed practical baseline IPAM data.

Usage:
  python manage.py seed_ipam
  python manage.py seed_ipam --subnets 18 --ips-per-subnet 8
  python manage.py seed_ipam --clear --no-input
"""

import ipaddress
import random

from django.core.management.base import BaseCommand

from infrastructure.models import Location
from ipam.models import (
    Customer,
    DNSRecord,
    DNSZone,
    Device,
    DeviceType,
    IPAddress,
    IPPool,
    IPTag,
    PhoneNumberRange,
    Subnet,
    SubnetGroup,
    VLAN,
    VRF,
)

GROUP_NAMES = ["Corporate", "Branch", "DataCenter", "Guest", "Voice", "Management"]
DEVICE_TYPES = ["Switch", "Router", "Firewall", "Server", "Wireless", "Database"]
TAG_CHOICES = [
    ("critical", "red"),
    ("infra", "blue"),
    ("voice", "purple"),
    ("guest", "yellow"),
    ("reserved", "orange"),
]


class Command(BaseCommand):
    help = "Seed IPAM core entities (VRFs, VLANs, subnets, pools, IPs, DNS, devices, tags)."

    def add_arguments(self, parser):
        parser.add_argument("--subnets", type=int, default=14, help="Number of subnets to create.")
        parser.add_argument(
            "--ips-per-subnet",
            type=int,
            default=6,
            help="Number of IP addresses to create per subnet.",
        )
        parser.add_argument("--clear", action="store_true", help="Delete IPAM data before seeding.")
        parser.add_argument("--no-input", action="store_true", help="Do not prompt when using --clear.")

    def handle(self, *args, **options):
        locations = list(Location.objects.all())
        if not locations:
            self.stdout.write(
                self.style.ERROR("No locations found. Run seed_infrastructure first.")
            )
            return

        if options["clear"]:
            if not self._confirm_clear(options["no_input"]):
                return
            self._clear_data()

        subnets_count = options["subnets"]
        ips_per_subnet = options["ips_per_subnet"]

        customers = self._seed_customers()
        groups = self._seed_groups()
        vrfs = self._seed_vrfs(locations)
        vlans = self._seed_vlans(locations, subnets_count)
        subnet_list = self._seed_subnets(subnets_count, locations, groups, vrfs, vlans, customers)
        self._seed_pools(subnet_list)
        ip_records = self._seed_ip_addresses(subnet_list, ips_per_subnet)
        self._seed_tags(ip_records)
        self._seed_dns(subnet_list, ip_records, locations)
        self._seed_devices(locations, ip_records)
        self._seed_phone_ranges(locations)

        self.stdout.write(
            self.style.SUCCESS(
                "Done. "
                f"Subnets={Subnet.objects.count()}, "
                f"IPs={IPAddress.objects.count()}, "
                f"VLANs={VLAN.objects.count()}, "
                f"VRFs={VRF.objects.count()}, "
                f"DNSZones={DNSZone.objects.count()}, "
                f"Devices={Device.objects.count()}"
            )
        )

    def _confirm_clear(self, no_input):
        if no_input:
            return True
        confirm = input("Delete seedable IPAM entities (subnets, IPs, DNS, devices, etc.)? [y/N]: ")
        if confirm.lower() != "y":
            self.stdout.write("Aborted.")
            return False
        return True

    def _clear_data(self):
        DNSRecord.objects.all().delete()
        DNSZone.objects.all().delete()
        Device.objects.all().delete()
        IPAddress.objects.all().delete()
        IPPool.objects.all().delete()
        Subnet.objects.all().delete()
        VLAN.objects.all().delete()
        VRF.objects.all().delete()
        SubnetGroup.objects.all().delete()
        DeviceType.objects.all().delete()
        IPTag.objects.all().delete()
        PhoneNumberRange.objects.all().delete()
        Customer.objects.all().delete()
        self.stdout.write(self.style.WARNING("Cleared core IPAM data."))

    def _seed_customers(self):
        customers = []
        for i, name in enumerate(["Internal", "Managed Services", "Tenant A", "Tenant B"]):
            customer, _ = Customer.objects.get_or_create(
                name=name,
                defaults={
                    "description": f"Seed customer profile for {name}.",
                    "contact_email": f"ipam-{i + 1}@example.com",
                    "contact_phone": f"+1-888-555-01{i + 10}",
                },
            )
            customers.append(customer)
        return customers

    def _seed_groups(self):
        groups = []
        for name in GROUP_NAMES:
            group, _ = SubnetGroup.objects.get_or_create(name=name, defaults={"description": f"{name} subnets"})
            groups.append(group)
        return groups

    def _seed_vrfs(self, locations):
        vrfs = []
        for i, location in enumerate(locations[:20]):
            vrf, _ = VRF.objects.get_or_create(
                name=f"VRF-{location.alias or location.name[:8]}",
                location=location,
                defaults={
                    "rd": f"65000:{100 + i}",
                    "description": f"VRF for {location.name}",
                },
            )
            vrfs.append(vrf)
        return vrfs

    def _seed_vlans(self, locations, count):
        vlans = []
        max_count = min(max(count, 1), 200)
        for i in range(max_count):
            location = random.choice(locations)
            vlan_id = 10 + i
            vlan, _ = VLAN.objects.get_or_create(
                vlan_id=vlan_id,
                location=location,
                defaults={
                    "name": f"VLAN-{vlan_id}",
                    "description": f"Seed VLAN {vlan_id} at {location.name}",
                },
            )
            vlans.append(vlan)
        return vlans

    def _seed_subnets(self, count, locations, groups, vrfs, vlans, customers):
        subnets = []
        statuses = [choice[0] for choice in Subnet.STATUS_CHOICES]
        for i in range(count):
            location = random.choice(locations)
            group = random.choice(groups) if groups else None
            vrf = random.choice(vrfs) if vrfs else None
            vlan = random.choice(vlans) if vlans else None
            customer = random.choice(customers) if random.random() > 0.4 else None
            octet_two = 20 + (i // 254)
            octet_three = (i % 254) + 1
            network = f"10.{octet_two}.{octet_three}.0/24"
            gateway = f"10.{octet_two}.{octet_three}.1"

            subnet, _ = Subnet.objects.get_or_create(
                network=network,
                location=location,
                defaults={
                    "description": f"Seed subnet {network} for {location.name}",
                    "group": group,
                    "vlan": vlan,
                    "vrf": vrf,
                    "gateway_ip": gateway,
                    "nameservers": "1.1.1.1,8.8.8.8",
                    "customer": customer,
                    "status": random.choice(statuses),
                },
            )
            subnets.append(subnet)
        return subnets

    def _seed_pools(self, subnets):
        for subnet in subnets:
            cidr = ipaddress.ip_network(subnet.network, strict=False)
            if cidr.num_addresses < 10:
                continue
            start_ip = str(cidr.network_address + 10)
            end_ip = str(cidr.network_address + 120)
            IPPool.objects.get_or_create(
                subnet=subnet,
                name=f"{subnet.network} Pool",
                defaults={
                    "description": "Primary allocation pool",
                    "start_ip": start_ip,
                    "end_ip": end_ip,
                    "reservation_policy": random.choice(["none", "percentage", "fixed"]),
                    "reserved_percentage": random.choice([0, 5, 10, 15]),
                    "reserved_count": random.choice([0, 2, 5]),
                    "is_active": True,
                },
            )

    def _seed_ip_addresses(self, subnets, ips_per_subnet):
        created = []
        statuses = [choice[0] for choice in IPAddress.STATUS_CHOICES]
        for subnet in subnets:
            cidr = ipaddress.ip_network(subnet.network, strict=False)
            hosts = list(cidr.hosts())
            if not hosts:
                continue
            slice_count = min(ips_per_subnet, len(hosts))
            for idx in range(slice_count):
                ip_addr = str(hosts[idx + 1] if idx + 1 < len(hosts) else hosts[idx])
                ip_obj, _ = IPAddress.objects.get_or_create(
                    address=ip_addr,
                    defaults={
                        "subnet": subnet,
                        "status": random.choice(statuses),
                        "description": f"Seeded IP in {subnet.network}",
                    },
                )
                created.append(ip_obj)
        return created

    def _seed_tags(self, ip_records):
        tags = []
        for name, color in TAG_CHOICES:
            tag, _ = IPTag.objects.get_or_create(
                name=name,
                defaults={"description": f"{name} tagged IPs", "color": color},
            )
            tags.append(tag)

        if not tags or not ip_records:
            return

        for ip_addr in random.sample(ip_records, k=min(len(ip_records), 25)):
            sample_size = random.randint(1, min(2, len(tags)))
            ip_addr.tags.add(*random.sample(tags, k=sample_size))

    def _seed_dns(self, subnets, ip_records, locations):
        if not subnets:
            return
        zone_names = ["corp.local", "internal.local", "branch.local"]
        zones = []
        for zone_name in zone_names:
            zone, _ = DNSZone.objects.get_or_create(
                name=zone_name,
                defaults={"description": "Seed DNS zone", "location": random.choice(locations)},
            )
            zones.append(zone)

        sample_ips = random.sample(ip_records, k=min(len(ip_records), 18)) if ip_records else []
        for idx, ip_obj in enumerate(sample_ips):
            zone = random.choice(zones)
            DNSRecord.objects.get_or_create(
                zone=zone,
                name=f"host-{idx + 1}",
                record_type="A",
                defaults={
                    "value": ip_obj.address,
                    "ttl": random.choice([300, 900, 3600]),
                    "description": "Seed A record",
                },
            )

    def _seed_devices(self, locations, ip_records):
        types = []
        for name in DEVICE_TYPES:
            dtype, _ = DeviceType.objects.get_or_create(
                name=name,
                defaults={"description": f"{name} devices"},
            )
            types.append(dtype)

        sample_ips = random.sample(ip_records, k=min(len(ip_records), 20)) if ip_records else []
        for idx, ip_obj in enumerate(sample_ips):
            location = random.choice(locations)
            dtype = random.choice(types) if types else None
            Device.objects.get_or_create(
                name=f"{(dtype.name if dtype else 'Device').lower()}-{idx + 1:03d}",
                defaults={
                    "ip_address": ip_obj.address,
                    "device_type": dtype,
                    "location": location,
                    "description": "Seeded from IPAM command",
                    "vendor": random.choice(["Cisco", "Juniper", "Aruba", "Dell"]),
                    "model": random.choice(["X1000", "SRX340", "C9300", "R640"]),
                    "version": random.choice(["1.0.0", "2.3.4", "17.9.4", "7.1"]),
                    "switch_port": random.choice(["wired", "wireless"]),
                    "sections": random.sample(["servers", "ipv6"], k=random.randint(0, 2)),
                    "is_active": True,
                },
            )

    def _seed_phone_ranges(self, locations):
        for idx, location in enumerate(locations[:10]):
            start = f"+1-312-{500 + idx}-{1000:04d}"
            stop = f"+1-312-{500 + idx}-{1099:04d}"
            PhoneNumberRange.objects.get_or_create(
                location=location,
                start_number=start,
                stop_number=stop,
                defaults={
                    "carrier": random.choice(["AT&T", "Lumen", "Comcast Business"]),
                    "trunk": f"TRUNK-{idx + 1:02d}",
                    "notes": "Seed phone range for branch voice services.",
                },
            )
