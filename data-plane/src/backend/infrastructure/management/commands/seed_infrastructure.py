"""
Seed realistic infrastructure data (locations, departments, contacts, circuits).

Usage:
  python manage.py seed_infrastructure
  python manage.py seed_infrastructure --locations 15 --circuits 30
  python manage.py seed_infrastructure --clear --no-input
"""

import random

from django.core.management.base import BaseCommand

from infrastructure.models import (
    CarrierContact,
    Category,
    Circuit,
    Contact,
    Department,
    Location,
    PointOfContact,
    UtilityContact,
)

LOCATION_BLUEPRINTS = [
    ("Headquarters", "Chicago", "IL", "60601", "Corporate Office"),
    ("West Hub", "Phoenix", "AZ", "85004", "Regional Office"),
    ("NOC Dallas", "Dallas", "TX", "75201", "Data Center"),
    ("Atlanta Branch", "Atlanta", "GA", "30303", "Branch"),
    ("San Jose Lab", "San Jose", "CA", "95112", "Lab"),
    ("Seattle Office", "Seattle", "WA", "98101", "Branch"),
    ("Denver Branch", "Denver", "CO", "80202", "Branch"),
    ("Boston Operations", "Boston", "MA", "02108", "Regional Office"),
    ("Miami Support", "Miami", "FL", "33131", "Support Center"),
    ("NYC East Hub", "New York", "NY", "10007", "Regional Office"),
]

DEPARTMENTS = [
    "Engineering",
    "Network Operations",
    "Security",
    "IT Support",
    "Finance",
    "People Operations",
    "Sales",
    "Customer Success",
]

CATEGORIES = [
    "Infrastructure",
    "Networking",
    "Telecom",
    "Security",
    "End User Computing",
    "Facilities",
]

FIRST_NAMES = ["Alex", "Jamie", "Taylor", "Jordan", "Casey", "Morgan", "Riley"]
LAST_NAMES = ["Smith", "Johnson", "Brown", "Davis", "Martinez", "Lee", "Wilson"]
CARRIERS = ["AT&T", "Lumen", "Comcast Business", "Verizon", "Zayo", "Cogent"]
UTILITY_NAMES = ["City Electric", "Metro Water", "Urban Sewage", "Regional Utilities"]


class Command(BaseCommand):
    help = "Seed infrastructure data used by other modules."

    def add_arguments(self, parser):
        parser.add_argument("--locations", type=int, default=10)
        parser.add_argument("--departments", type=int, default=8)
        parser.add_argument("--contacts", type=int, default=20)
        parser.add_argument("--circuits", type=int, default=18)
        parser.add_argument("--clear", action="store_true")
        parser.add_argument("--no-input", action="store_true")

    def handle(self, *args, **options):
        if options["clear"]:
            if not self._confirm_clear(options["no_input"]):
                return
            self._clear_data()

        locations = self._seed_locations(options["locations"])
        self._seed_departments(options["departments"])
        self._seed_categories()
        self._seed_contacts(options["contacts"])
        circuits = self._seed_circuits(options["circuits"], locations)
        self._seed_support_contacts(locations, circuits)

        self.stdout.write(
            self.style.SUCCESS(
                "Done. "
                f"Locations={Location.objects.count()}, "
                f"Departments={Department.objects.count()}, "
                f"Contacts={Contact.objects.count()}, "
                f"Circuits={Circuit.objects.count()}"
            )
        )

    def _confirm_clear(self, no_input):
        if no_input:
            return True
        confirm = input(
            "This will delete all infrastructure seedable data (locations, circuits, contacts). "
            "Continue? [y/N]: "
        )
        if confirm.lower() != "y":
            self.stdout.write("Aborted.")
            return False
        return True

    def _clear_data(self):
        PointOfContact.objects.all().delete()
        Circuit.objects.all().delete()
        CarrierContact.objects.all().delete()
        UtilityContact.objects.all().delete()
        Contact.objects.all().delete()
        Location.objects.all().delete()
        Department.objects.all().delete()
        Category.objects.all().delete()
        self.stdout.write(self.style.WARNING("Cleared infrastructure data."))

    def _seed_locations(self, target_count):
        if target_count <= 0:
            return list(Location.objects.all())

        seeded = []
        for i in range(target_count):
            base = LOCATION_BLUEPRINTS[i % len(LOCATION_BLUEPRINTS)]
            suffix = f" #{i + 1}" if i >= len(LOCATION_BLUEPRINTS) else ""
            name = f"{base[0]}{suffix}"
            location, _ = Location.objects.get_or_create(
                name=name,
                defaults={
                    "alias": f"LOC-{i + 1:03d}",
                    "address1": f"{100 + i} Main St",
                    "city": base[1],
                    "state": base[2],
                    "zip_code": base[3],
                    "phone": f"+1-312-{200 + (i % 700):03d}-{1000 + (i % 8999):04d}",
                    "type_building": base[4],
                    "mpoe": random.choice(["Suite 100", "Telco Room A", "MDF-1"]),
                    "dmarc": random.choice(["Main Closet", "Basement Rack", "Floor 2 IDF"]),
                },
            )
            seeded.append(location)
        self.stdout.write(self.style.SUCCESS(f"Seeded/verified {len(seeded)} locations."))
        return seeded

    def _seed_departments(self, target_count):
        if target_count <= 0:
            return
        names = (DEPARTMENTS * ((target_count // len(DEPARTMENTS)) + 1))[:target_count]
        for i, name in enumerate(names):
            normalized = name if i < len(DEPARTMENTS) else f"{name} {i + 1}"
            Department.objects.get_or_create(name=normalized)
        self.stdout.write(self.style.SUCCESS(f"Seeded/verified {target_count} departments."))

    def _seed_categories(self):
        for name in CATEGORIES:
            Category.objects.get_or_create(name=name)
        self.stdout.write(self.style.SUCCESS("Seeded/verified infrastructure categories."))

    def _seed_contacts(self, target_count):
        if target_count <= 0:
            return
        for i in range(target_count):
            first = random.choice(FIRST_NAMES)
            last = random.choice(LAST_NAMES)
            Contact.objects.get_or_create(
                first_name=first,
                last_name=f"{last}{i if i > 0 else ''}",
                defaults={
                    "job_title": random.choice(
                        [
                            "Network Engineer",
                            "IT Manager",
                            "Field Technician",
                            "Security Analyst",
                        ]
                    ),
                    "business_phone": f"+1-773-{200 + (i % 700):03d}-{1000 + (i % 8999):04d}",
                    "mobile_phone": f"+1-224-{200 + (i % 700):03d}-{1000 + (i % 8999):04d}",
                    "city": random.choice(["Chicago", "Dallas", "Phoenix", "Seattle"]),
                    "state": random.choice(["IL", "TX", "AZ", "WA"]),
                    "country": "USA",
                    "contact_type": random.choice(
                        ["Vendor", "Carrier", "Internal", "Utility", "Emergency"]
                    ),
                },
            )
        self.stdout.write(self.style.SUCCESS(f"Seeded/verified {target_count} contacts."))

    def _seed_circuits(self, target_count, locations):
        if target_count <= 0 or not locations:
            return []
        circuits = []
        speeds = [100, 250, 500, 1000, 2000, 5000, 10000]
        for i in range(target_count):
            location = random.choice(locations)
            circuit, _ = Circuit.objects.get_or_create(
                location=location,
                circuit_id=f"CIR-{location.id:03d}-{i + 1:04d}",
                defaults={
                    "speed": random.choice(speeds),
                    "carrier": random.choice(CARRIERS),
                },
            )
            circuits.append(circuit)
        self.stdout.write(self.style.SUCCESS(f"Seeded/verified {len(circuits)} circuits."))
        return circuits

    def _seed_support_contacts(self, locations, circuits):
        for location in locations:
            CarrierContact.objects.get_or_create(
                name=f"{location.name} Carrier Desk",
                location=location,
                defaults={
                    "customer_service_phone": "+1-800-555-0101",
                    "technical_support_phone": "+1-800-555-0110",
                    "sales_phone": "+1-800-555-0120",
                    "billing_phone": "+1-800-555-0130",
                },
            )
            UtilityContact.objects.get_or_create(
                name=f"{random.choice(UTILITY_NAMES)} - {location.city}",
                location=location,
                utility_type=random.choice(["electric", "water", "sewage"]),
                defaults={
                    "city": location.city,
                    "state": location.state,
                    "zip_code": location.zip_code,
                    "customer_service_phone": "+1-888-555-0140",
                    "technical_support_phone": "+1-888-555-0150",
                    "sales_phone": "+1-888-555-0160",
                    "billing_phone": "+1-888-555-0170",
                },
            )

        for circuit in circuits:
            for contact_type in ("technical", "administrative"):
                PointOfContact.objects.get_or_create(
                    circuit=circuit,
                    contact_type=contact_type,
                    defaults={
                        "name": f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
                        "email": f"{contact_type}.{circuit.id}@example.com",
                        "phone": (
                            f"+1-877-{200 + (circuit.id % 700):03d}"
                            f"-{1000 + (circuit.id % 8999):04d}"
                        ),
                    },
                )

        self.stdout.write(self.style.SUCCESS("Seeded/verified carrier, utility, and PoC records."))
