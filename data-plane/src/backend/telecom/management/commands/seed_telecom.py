"""
Django management command to seed dummy data for Telecom Expense Management.
Creates providers, services (business-facing), data circuits (technical), and phone numbers.
Services and data circuits are distinct; circuits can be linked to a service.

Usage:
  python manage.py seed_telecom
  python manage.py seed_telecom --providers 5 --circuits 20
  python manage.py seed_telecom --clear
"""

import random
from datetime import date, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand

from infrastructure.models import Location
from telecom.models import DataCircuit, PhoneNumber, Provider, Service

# Static fake data (no Faker dependency)
FAKE_COMPANIES = [
    "Acme Telecom",
    "MetroNet Solutions",
    "FiberFirst Inc",
    "DataStream Corp",
    "ClearLink Communications",
    "SwiftBand Networks",
    "NorthStar Telecom",
    "Pacific Wave",
    "Summit Data Co",
    "Horizon Broadband",
]
FAKE_FIRST_NAMES = ["Jamie", "Morgan", "Casey", "Riley", "Quinn", "Alex", "Jordan"]
FAKE_LAST_NAMES = ["Smith", "Chen", "Williams", "Brown", "Davis", "Wilson"]
FAKE_SENTENCES = [
    "Primary circuit for HQ.",
    "Backup link.",
    "Branch office connection.",
    "Dedicated internet access.",
    "MPLS endpoint.",
]


class Command(BaseCommand):
    help = (
        "Seed dummy providers, services, data circuits, and phone numbers "
        "for Telecom Expense Management"
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--providers",
            type=int,
            default=5,
            help="Number of providers to create (default: 5)",
        )
        parser.add_argument(
            "--services",
            type=int,
            default=15,
            help="Number of services (business-facing) to create (default: 15)",
        )
        parser.add_argument(
            "--circuits",
            type=int,
            default=15,
            help="Number of data circuits (technical) to create (default: 15)",
        )
        parser.add_argument(
            "--phone-numbers",
            type=int,
            default=20,
            help="Number of phone numbers to create (default: 20)",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete existing telecom data (providers and circuits) before seeding",
        )
        parser.add_argument(
            "--no-input",
            action="store_true",
            help="Do not prompt when using --clear",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            self._clear_telecom_data(options["no_input"])
            if (
                options["providers"] == 0
                and options["services"] == 0
                and options["circuits"] == 0
                and options["phone_numbers"] == 0
            ):
                return

        provider_count = options["providers"]
        service_count = options["services"]
        circuit_count = options["circuits"]
        phone_count = options["phone_numbers"]
        locations = list(Location.objects.all()[:20])

        self.stdout.write("Creating telecom providers...")
        providers = self._create_providers(provider_count)
        self.stdout.write(self.style.SUCCESS(f"  Created {len(providers)} providers"))

        self.stdout.write("Creating services (business-facing)...")
        services = self._create_services(
            providers=providers,
            count=service_count,
            locations=locations,
        )
        self.stdout.write(self.style.SUCCESS(f"  Created {len(services)} services"))

        self.stdout.write("Creating data circuits (technical)...")
        circuits_created = self._create_data_circuits(
            providers=providers,
            services=services,
            count=circuit_count,
            locations=locations,
        )
        self.stdout.write(self.style.SUCCESS(f"  Created {circuits_created} data circuits"))

        self.stdout.write("Creating phone numbers...")
        phones_created = self._create_phone_numbers(
            providers=providers,
            services=services,
            locations=locations,
            count=phone_count,
        )
        self.stdout.write(self.style.SUCCESS(f"  Created {phones_created} phone numbers"))

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. Providers: {Provider.objects.count()}, "
                f"Services: {Service.objects.count()}, "
                f"Data circuits: {DataCircuit.objects.count()}, "
                f"Phone numbers: {PhoneNumber.objects.count()}"
            )
        )

    def _clear_telecom_data(self, no_input):
        phone_count = PhoneNumber.objects.count()
        circuit_count = DataCircuit.objects.count()
        service_count = Service.objects.count()
        provider_count = Provider.objects.count()
        if phone_count == 0 and circuit_count == 0 and service_count == 0 and provider_count == 0:
            self.stdout.write("No telecom data to clear.")
            return
        if not no_input:
            confirm = input(
                f"Delete {provider_count} providers, {service_count} services, "
                f"{circuit_count} data circuits, and {phone_count} phone numbers? [y/N]: "
            )
            if confirm.lower() != "y":
                self.stdout.write("Aborted.")
                return
        PhoneNumber.objects.all().delete()
        DataCircuit.objects.all().delete()
        Service.objects.all().delete()
        Provider.objects.all().delete()
        self.stdout.write(
            self.style.WARNING(
                "Cleared all telecom providers, services, data circuits, and phone numbers."
            )
        )

    def _create_providers(self, count):
        service_types = [c[0] for c in Provider.SERVICE_TYPE_CHOICES]
        statuses = [c[0] for c in Provider.STATUS_CHOICES]
        providers = []
        companies = (FAKE_COMPANIES * ((count // len(FAKE_COMPANIES)) + 1))[:count]
        for i, name in enumerate(companies):
            suffix = f" #{i + 1}" if companies.count(name) > 1 else ""
            provider = Provider.objects.create(
                name=name + suffix,
                description=random.choice(FAKE_SENTENCES) if random.random() > 0.5 else None,
                service_type=random.choice(service_types),
                status=random.choice(statuses),
                account_number=(
                    f"ACC{random.randint(100000, 999999)}" if random.random() > 0.4 else None
                ),
                contact_name=(
                    f"{random.choice(FAKE_FIRST_NAMES)} {random.choice(FAKE_LAST_NAMES)}"
                    if random.random() > 0.5
                    else None
                ),
                contact_email=f"contact{i}@example.com" if random.random() > 0.5 else None,
                contact_phone=(
                    f"555-{random.randint(100, 999)}-{random.randint(1000, 9999)}"
                    if random.random() > 0.5
                    else None
                ),
                website=f"https://example-{i}.com" if random.random() > 0.6 else None,
                monthly_cost=(
                    Decimal(str(round(random.uniform(200, 5000), 2)))
                    if random.random() > 0.3
                    else None
                ),
                notes=random.choice(FAKE_SENTENCES) if random.random() > 0.7 else None,
            )
            providers.append(provider)
        return providers

    def _create_services(self, providers, count, locations):
        if not providers:
            return []
        service_names = [
            "HQ Main Data",
            "Branch Internet",
            "DevOps Main Data",
            "Backup Link",
            "MPLS Primary",
            "DIA Primary",
            "Voice PRI",
            "Conference SIP",
        ]
        service_categories = [c[0] for c in Service.SERVICE_CATEGORY_CHOICES]
        service_types = [c[0] for c in Service.SERVICE_TYPE_CHOICES]
        services = []
        for i in range(count):
            provider = random.choice(providers)
            location = random.choice(locations) if locations else None
            name = (
                f"{random.choice(service_names)} {i + 1}"
                if count > len(service_names)
                else (service_names[i] if i < len(service_names) else f"Service {i + 1}")
            )
            svc = Service.objects.create(
                name=name,
                provider=provider,
                location=location,
                service_category=random.choice(service_categories),
                service_type=random.choice(service_types),
                account_number=provider.account_number or f"ACC{random.randint(100000, 999999)}",
                security_code=f"SC{random.randint(1000, 9999)}" if random.random() > 0.7 else None,
                contract_id=(
                    f"CON-{random.randint(100000, 999999)}" if random.random() > 0.6 else None
                ),
                monthly_cost=Decimal(str(round(random.uniform(100, 3000), 2))),
                notes=random.choice(FAKE_SENTENCES) if random.random() > 0.8 else None,
            )
            services.append(svc)
        return services

    def _create_data_circuits(self, providers, services, count, locations):
        if not providers:
            return 0
        circuit_types = [c[0] for c in DataCircuit.CIRCUIT_TYPE_CHOICES]
        line_speeds = [c[0] for c in DataCircuit.LINE_SPEED_CHOICES]
        handoff_types = [c[0] for c in DataCircuit.HANDOFF_TYPE_CHOICES]
        fiber_types = [c[0] for c in DataCircuit.FIBER_TYPE_CHOICES]
        connector_types = [c[0] for c in DataCircuit.CONNECTOR_TYPE_CHOICES]
        created = 0
        for _ in range(count):
            provider = random.choice(providers)
            location = random.choice(locations) if locations else None
            service = random.choice(services) if services else None
            circuit_id = f"CIR-{random.randint(10000000, 99999999)}"
            circuit_type = random.choice(circuit_types)
            line_speed = random.choice(line_speeds)
            handoff = random.choice(handoff_types)
            DataCircuit.objects.create(
                provider=provider,
                location=location,
                service=service,
                circuit_id=circuit_id,
                alternate_cid=(
                    f"ALT-{random.randint(100000, 999999)}" if random.random() > 0.6 else None
                ),
                carrier=provider.name,
                account_number=provider.account_number or f"ACC{random.randint(100000, 999999)}",
                security_code=f"SC{random.randint(1000, 9999)}" if random.random() > 0.7 else None,
                circuit_type=circuit_type,
                line_speed=line_speed,
                port_speed=f"{random.choice([1, 10, 100])} Gbps" if random.random() > 0.5 else None,
                handoff_type=handoff,
                fiber_type=random.choice(fiber_types) if handoff == "fiber" else None,
                connector_type=random.choice(connector_types) if handoff == "fiber" else None,
                quote_id=f"Q-{random.randint(100000, 999999)}" if random.random() > 0.7 else None,
                contract_id=(
                    f"CON-{random.randint(100000, 999999)}" if random.random() > 0.6 else None
                ),
                foc_date=(
                    date.today() - timedelta(days=random.randint(30, 365))
                    if random.random() > 0.5
                    else None
                ),
                ttu_date=(
                    date.today() - timedelta(days=random.randint(0, 180))
                    if random.random() > 0.5
                    else None
                ),
                monthly_cost=Decimal(str(round(random.uniform(100, 3000), 2))),
                notes=random.choice(FAKE_SENTENCES) if random.random() > 0.8 else None,
            )
            created += 1
        return created

    def _create_phone_numbers(self, providers, services, locations, count):
        if not providers:
            return 0
        created = 0
        area = 312
        for _ in range(count):
            provider = random.choice(providers)
            service = random.choice(services) if services else None
            location = random.choice(locations) if locations else None
            number = f"+1-{area}-{random.randint(200, 999)}-{random.randint(1000, 9999)}"
            friendly_names = [
                "DevOps Utah PRI",
                "HQ Main",
                "Support Line",
                "Sales Direct",
                "Conference",
                "Reception",
            ]
            friendly = random.choice(friendly_names) if random.random() > 0.3 else None
            PhoneNumber.objects.create(
                number=number,
                friendly_name=friendly,
                provider=provider,
                service=service,
                location=location,
                notes=random.choice(FAKE_SENTENCES) if random.random() > 0.8 else None,
            )
            created += 1
        return created
