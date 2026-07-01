"""
Seed realistic assets and related records.

Usage:
  python manage.py seed_assets
  python manage.py seed_assets --count 60 --relations 20 --alerts 25
  python manage.py seed_assets --clear --no-input
"""

import random
from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.utils import timezone

from assets.models import (
    Asset,
    AssetCategory,
    AssetRelation,
    AssetTag,
    CalendarAlert,
    ComputerDetails,
    CustomLifecycle,
    DisplayDetails,
    NetworkDetails,
    PeripheralDetails,
    PhoneDetails,
    Vendor,
)
from infrastructure.models import Department, Location

User = get_user_model()

VENDORS = [
    "Cisco",
    "Juniper",
    "Palo Alto Networks",
    "Fortinet",
    "Aruba",
    "Dell",
    "Lenovo",
    "HP",
    "Apple",
    "Samsung",
    "Logitech",
    "Poly",
    "Yealink",
    "Epson",
]

ASSET_TAGS = [
    ("Production", "#EF4444"),
    ("Office", "#3B82F6"),
    ("Lab", "#A855F7"),
    ("Spare", "#14B8A6"),
    ("Critical", "#F97316"),
    ("Loaner", "#22C55E"),
]

LIFECYCLES = [
    ("New", "Recently acquired and not yet assigned."),
    ("In Use", "Actively assigned and operational."),
    ("Maintenance", "Under active maintenance/repair."),
    ("Ready for Replacement", "Approaching end of life."),
]

CATEGORY_MODEL_MAP = {
    "Laptop": ["Latitude 7440", "ThinkPad T14", "MacBook Pro 14", "EliteBook 840 G10"],
    "Desktop": ["OptiPlex 7010", "ThinkCentre M90", "HP ProDesk 600", "Mac Mini M2"],
    "Server": ["PowerEdge R650", "ProLiant DL380", "ThinkSystem SR650"],
    "Router": ["ISR 4331", "MX204", "FortiGate 200F", "EdgeRouter Infinity"],
    "Switch": ["Catalyst 9300", "EX4300", "Aruba 6200F", "Nexus 93180"],
    "Firewall": ["PA-3220", "FortiGate 100F", "ASA 5516-X"],
    "TV": ["Samsung QN90", "LG OLED C3", "Sony Bravia X90"],
    "Phone": ["Yealink T54W", "Poly VVX 450", "Cisco 8845"],
    "Phone System": ["Cisco CUCM Node", "3CX PBX Appliance", "Asterisk VoIP Gateway"],
    "Printer": ["HP LaserJet MFP M430", "Epson EcoTank ET-4850", "Brother HL-L6400"],
    "Tablet": ["iPad Air 5", "Galaxy Tab S9", "Surface Go 4"],
    "Thin Client": ["Dell Wyse 5070", "HP t640", "IGEL UD3"],
    "Other": ["Edge Appliance", "Wireless Controller", "KVM Unit"],
}

COMPUTER_CATEGORIES = {"Laptop", "Desktop", "Server", "Thin Client", "Tablet", "Apple Device"}
NETWORK_CATEGORIES = {"Router", "Switch", "Firewall", "Other"}
DISPLAY_CATEGORIES = {"TV"}
PHONE_CATEGORIES = {"Phone", "Phone System"}
PERIPHERAL_CATEGORIES = {"Printer", "Dongle", "Mobile", "iPad", "iPhone"}


class Command(BaseCommand):
    help = "Seed realistic assets with tech-specific details."

    def add_arguments(self, parser):
        parser.add_argument("--count", type=int, default=45, help="Number of assets to create.")
        parser.add_argument("--relations", type=int, default=15, help="Number of asset relations.")
        parser.add_argument("--alerts", type=int, default=20, help="Number of calendar alerts.")
        parser.add_argument("--clear", action="store_true", help="Delete existing assets before seed.")
        parser.add_argument("--no-input", action="store_true", help="Do not prompt with --clear.")

    def handle(self, *args, **options):
        self._ensure_baseline_data()

        if options["clear"]:
            if not self._confirm_clear(options["no_input"]):
                return
            self._clear_assets()

        tags = self._ensure_tags()
        lifecycles = self._ensure_lifecycles()
        locations = list(Location.objects.all())
        departments = list(Department.objects.all())
        users = list(User.objects.filter(is_active=True)[:50])
        categories = list(AssetCategory.objects.exclude(name__iexact="Unrecognized"))
        vendors = list(Vendor.objects.all())

        if not categories:
            self.stdout.write(self.style.ERROR("No asset categories found; run seed_asset_categories."))
            return
        if not vendors:
            self.stdout.write(self.style.ERROR("No vendors found; run seed_vendors or add vendors first."))
            return

        created_assets = self._create_assets(
            count=options["count"],
            categories=categories,
            vendors=vendors,
            users=users,
            locations=locations,
            departments=departments,
            tags=tags,
            lifecycles=lifecycles,
        )
        self._create_relations(created_assets, options["relations"])
        self._create_alerts(created_assets, users, options["alerts"])

        self.stdout.write(
            self.style.SUCCESS(
                "Done. "
                f"Assets={Asset.objects.count()}, "
                f"Tags={AssetTag.objects.count()}, "
                f"Lifecycles={CustomLifecycle.objects.count()}, "
                f"Relations={AssetRelation.objects.count()}, "
                f"Alerts={CalendarAlert.objects.count()}"
            )
        )

    def _ensure_baseline_data(self):
        call_command("seed_asset_categories")
        if not Vendor.objects.exists():
            for name in VENDORS:
                Vendor.objects.get_or_create(name=name)
            self.stdout.write(self.style.SUCCESS("Created baseline vendors."))

    def _confirm_clear(self, no_input):
        if no_input:
            return True
        confirm = input("Delete all existing assets, alerts, and relations? [y/N]: ")
        if confirm.lower() != "y":
            self.stdout.write("Aborted.")
            return False
        return True

    def _clear_assets(self):
        CalendarAlert.objects.all().delete()
        AssetRelation.objects.all().delete()
        Asset.objects.all().delete()
        self.stdout.write(self.style.WARNING("Cleared existing assets, relations, and alerts."))

    def _ensure_tags(self):
        tags = []
        for name, color in ASSET_TAGS:
            tag, _ = AssetTag.objects.get_or_create(name=name, defaults={"color": color})
            if not tag.color:
                tag.color = color
                tag.save(update_fields=["color"])
            tags.append(tag)
        return tags

    def _ensure_lifecycles(self):
        lifecycles = []
        for name, description in LIFECYCLES:
            lifecycle, _ = CustomLifecycle.objects.get_or_create(
                name=name,
                defaults={"description": description},
            )
            lifecycles.append(lifecycle)
        return lifecycles

    def _create_assets(
        self, count, categories, vendors, users, locations, departments, tags, lifecycles
    ):
        created = []
        statuses = [choice[0] for choice in Asset.STATUS_CHOICES]
        now = timezone.now().date()

        for i in range(count):
            category = random.choice(categories)
            vendor = random.choice(vendors)
            model = random.choice(CATEGORY_MODEL_MAP.get(category.name, ["Standard Model"]))
            purchase_date = now - timedelta(days=random.randint(45, 1800))
            useful_life = random.choice([3, 4, 5, 6, 7])
            warranty_exp = purchase_date + timedelta(days=365 * random.choice([1, 2, 3]))
            acquisition_date = purchase_date - timedelta(days=random.randint(0, 20))

            asset = Asset.objects.create(
                name=f"{category.name} - {vendor.name} {model} #{i + 1:03d}",
                category=category,
                asset_tag=f"AST-{now.year}-{i + 1:05d}",
                impact=random.randint(1, 3),
                vendor=vendor,
                model=model,
                serial_number=f"SN-{vendor.name[:3].upper()}-{random.randint(100000, 999999)}",
                status=random.choice(statuses),
                purchase_date=purchase_date,
                assigned_to=random.choice(users) if users and random.random() > 0.35 else None,
                location=random.choice(locations) if locations else None,
                notes=random.choice(
                    [
                        "Installed in production and monitored by NOC.",
                        "Assigned to support engineering team.",
                        "Spare unit kept in IT storage.",
                        "Used for branch-site failover readiness.",
                    ]
                ),
                manufacturer=vendor.name,
                mac_address=self._random_mac() if random.random() > 0.25 else None,
                ip_address=f"10.{random.randint(10, 99)}.{random.randint(0, 254)}.{random.randint(10, 240)}"
                if random.random() > 0.30
                else None,
                system_uuid=f"{random.randint(10000000, 99999999)}-ABCD-{random.randint(1000, 9999)}",
                in_current_state_since=now - timedelta(days=random.randint(1, 720)),
                expected_checkin_date=now + timedelta(days=random.randint(10, 120))
                if random.random() > 0.7
                else None,
                used_by=random.choice(users) if users and random.random() > 0.45 else None,
                managed_by=random.choice(users) if users and random.random() > 0.50 else None,
                custom_lifecycle=random.choice(lifecycles),
                purchase_price=Decimal(str(round(random.uniform(250, 18000), 2))),
                replacement_cost=Decimal(str(round(random.uniform(300, 20000), 2))),
                salvage_value=Decimal(str(round(random.uniform(20, 3000), 2))),
                useful_life_years=useful_life,
                approaching_eol_months=random.randint(1, 18),
                po_number=f"PO-{random.randint(100000, 999999)}",
                machine_serial_number=f"MSN-{random.randint(100000, 999999)}",
                product_number=f"PN-{random.randint(10000, 99999)}",
                acquisition_date=acquisition_date,
                warranty_expiration=warranty_exp,
                installation_date=purchase_date + timedelta(days=random.randint(1, 45)),
            )

            if departments:
                asset.departments.set(random.sample(departments, k=random.randint(1, min(2, len(departments)))))
            if tags:
                asset.tags.set(random.sample(tags, k=random.randint(1, min(3, len(tags)))))

            self._create_details(asset, category.name)
            created.append(asset)

        self.stdout.write(self.style.SUCCESS(f"Created {len(created)} realistic assets."))
        return created

    def _create_details(self, asset, category_name):
        if category_name in COMPUTER_CATEGORIES:
            ComputerDetails.objects.create(
                asset=asset,
                cpu=random.choice(["Intel Core i7", "Intel Xeon Silver", "AMD Ryzen 7", "Apple M2 Pro"]),
                ram=random.choice(["8GB DDR4", "16GB DDR5", "32GB DDR5", "64GB ECC"]),
                storage=random.choice(["512GB NVMe", "1TB NVMe", "2TB SSD", "4TB RAID"]),
                gpu=random.choice(["Intel Iris Xe", "NVIDIA T1000", "RTX 4060", "Integrated"]),
                os=random.choice(["Windows 11 Pro", "Ubuntu 24.04", "macOS Sonoma", "Windows Server 2022"]),
                processor=random.choice(["i7-13700", "Xeon Silver 4310", "Ryzen 7 7840", "M2 Pro"]),
                memory=random.choice(["16GB", "32GB", "64GB"]),
                hard_drive=random.choice(["512GB SSD", "1TB SSD", "2TB NVMe"]),
                serial_number=asset.serial_number,
                product_model_number=asset.product_number,
            )
            return

        if category_name in NETWORK_CATEGORIES:
            NetworkDetails.objects.create(
                asset=asset,
                mac_address=asset.mac_address or self._random_mac(),
                ip_address=asset.ip_address,
                firmware=random.choice(["17.9.4", "10.2.8", "9.3(7)", "7.0.12"]),
                ports_count=random.choice([8, 16, 24, 48]),
                throughput=random.choice(["1Gbps", "10Gbps", "40Gbps", "100Gbps"]),
                ports=random.choice(["24x1G + 4x10G", "48x1G + 6x40G", "8x10G + 2x40G"]),
                serial_number=asset.serial_number,
                product_model_number=asset.product_number,
                sku=f"SKU-{random.randint(100000, 999999)}",
                upc=f"{random.randint(100000000000, 999999999999)}",
                mpn=f"MPN-{random.randint(10000, 99999)}",
                cpn=f"CPN-{random.randint(10000, 99999)}",
                ean=f"{random.randint(1000000000000, 9999999999999)}",
                gtin=f"{random.randint(10000000000000, 99999999999999)}",
            )
            return

        if category_name in DISPLAY_CATEGORIES:
            DisplayDetails.objects.create(
                asset=asset,
                size_inches=random.choice([24, 27, 32, 43, 55, 65, 75]),
                resolution=random.choice(["1920x1080", "2560x1440", "3840x2160"]),
                panel_type=random.choice(["IPS", "LED", "OLED", "VA"]),
                refresh_rate=random.choice([60, 75, 120]),
            )
            return

        if category_name in PHONE_CATEGORIES:
            PhoneDetails.objects.create(
                asset=asset,
                connection_interface=random.choice(["VoIP", "SIP", "Digital", "PoE"]),
                phone_type=random.choice(["Desk Phone", "VoIP Phone", "Conference Phone"]),
                extension=str(random.randint(1000, 8999)),
                serial_number=asset.serial_number,
                product_model_number=asset.product_number,
            )
            return

        if category_name in PERIPHERAL_CATEGORIES:
            PeripheralDetails.objects.create(
                asset=asset,
                connection_type=random.choice(["USB-A", "USB-C", "Bluetooth", "WiFi"]),
                peripheral_type=random.choice(["Printer", "Tablet", "Mobile Device", "Dongle"]),
                serial_number=asset.serial_number,
                product_model_number=asset.product_number,
            )

    def _create_relations(self, assets, count):
        if count <= 0 or len(assets) < 2:
            return
        pairs = 0
        attempts = 0
        while pairs < count and attempts < (count * 5):
            primary, related = random.sample(assets, 2)
            _, created = AssetRelation.objects.get_or_create(asset=primary, related_asset=related)
            if created:
                pairs += 1
            attempts += 1
        self.stdout.write(self.style.SUCCESS(f"Created {pairs} asset relations."))

    def _create_alerts(self, assets, users, count):
        if count <= 0 or not assets:
            return
        for _ in range(count):
            asset = random.choice(assets)
            CalendarAlert.objects.create(
                asset=asset,
                date=timezone.now().date() + timedelta(days=random.randint(3, 240)),
                message=random.choice(
                    [
                        "Warranty review due.",
                        "Planned maintenance window.",
                        "Lifecycle replacement checkpoint.",
                        "Compliance verification reminder.",
                    ]
                ),
                assigned_to=random.choice(users) if users and random.random() > 0.5 else None,
            )
        self.stdout.write(self.style.SUCCESS(f"Created {count} calendar alerts."))

    def _random_mac(self):
        return ":".join(f"{random.randint(0, 255):02X}" for _ in range(6))
