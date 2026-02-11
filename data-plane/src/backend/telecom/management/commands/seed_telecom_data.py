"""
Django management command to seed dummy data for Telecom Expense Management.
Creates providers and data circuits (services). Optionally uses existing locations.

Usage:
  python manage.py seed_telecom_data
  python manage.py seed_telecom_data --providers 5 --circuits 20
  python manage.py seed_telecom_data --clear
"""

import random
from datetime import date, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand

from infrastructure.models import Location
from telecom.models import DataCircuit, Provider

# Static fake data (no Faker dependency)
FAKE_COMPANIES = [
    "Acme Telecom", "MetroNet Solutions", "FiberFirst Inc", "DataStream Corp",
    "ClearLink Communications", "SwiftBand Networks", "NorthStar Telecom",
    "Pacific Wave", "Summit Data Co", "Horizon Broadband",
]
FAKE_FIRST_NAMES = ["Jamie", "Morgan", "Casey", "Riley", "Quinn", "Alex", "Jordan"]
FAKE_LAST_NAMES = ["Smith", "Chen", "Williams", "Brown", "Davis", "Wilson"]
FAKE_SENTENCES = [
    "Primary circuit for HQ.", "Backup link.", "Branch office connection.",
    "Dedicated internet access.", "MPLS endpoint.",
]


class Command(BaseCommand):
    help = "Seed dummy providers and data circuits (services) for Telecom Expense Management"

    def add_arguments(self, parser):
        parser.add_argument(
            "--providers",
            type=int,
            default=5,
            help="Number of providers to create (default: 5)",
        )
        parser.add_argument(
            "--circuits",
            type=int,
            default=15,
            help="Number of data circuits (services) to create (default: 15)",
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
            if options["providers"] == 0 and options["circuits"] == 0:
                return

        provider_count = options["providers"]
        circuit_count = options["circuits"]

        self.stdout.write("Creating telecom providers...")
        providers = self._create_providers(provider_count)
        self.stdout.write(self.style.SUCCESS(f"  Created {len(providers)} providers"))

        self.stdout.write("Creating data circuits (services)...")
        locations = list(Location.objects.all()[:20])
        circuits_created = self._create_data_circuits(
            providers=providers,
            count=circuit_count,
            locations=locations,
        )
        self.stdout.write(self.style.SUCCESS(f"  Created {circuits_created} data circuits"))

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. Providers: {Provider.objects.count()}, "
                f"Data circuits: {DataCircuit.objects.count()}"
            )
        )

    def _clear_telecom_data(self, no_input):
        circuit_count = DataCircuit.objects.count()
        provider_count = Provider.objects.count()
        if circuit_count == 0 and provider_count == 0:
            self.stdout.write("No telecom data to clear.")
            return
        if not no_input:
            confirm = input(
                f"Delete {provider_count} providers and {circuit_count} data circuits? [y/N]: "
            )
            if confirm.lower() != "y":
                self.stdout.write("Aborted.")
                return
        DataCircuit.objects.all().delete()
        Provider.objects.all().delete()
        self.stdout.write(self.style.WARNING("Cleared all telecom providers and data circuits."))

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
                account_number=f"ACC{random.randint(100000, 999999)}" if random.random() > 0.4 else None,
                contact_name=f"{random.choice(FAKE_FIRST_NAMES)} {random.choice(FAKE_LAST_NAMES)}"
                if random.random() > 0.5
                else None,
                contact_email=f"contact{i}@example.com" if random.random() > 0.5 else None,
                contact_phone=f"555-{random.randint(100, 999)}-{random.randint(1000, 9999)}"
                if random.random() > 0.5
                else None,
                website=f"https://example-{i}.com" if random.random() > 0.6 else None,
                monthly_cost=Decimal(str(round(random.uniform(200, 5000), 2)))
                if random.random() > 0.3
                else None,
                notes=random.choice(FAKE_SENTENCES) if random.random() > 0.7 else None,
            )
            providers.append(provider)
        return providers

    def _create_data_circuits(self, providers, count, locations):
        if not providers:
            return 0
        circuit_types = [c[0] for c in DataCircuit.CIRCUIT_TYPE_CHOICES]
        line_speeds = [c[0] for c in DataCircuit.LINE_SPEED_CHOICES]
        handoff_types = [c[0] for c in DataCircuit.HANDOFF_TYPE_CHOICES]
        fiber_types = [c[0] for c in DataCircuit.FIBER_TYPE_CHOICES]
        connector_types = [c[0] for c in DataCircuit.CONNECTOR_TYPE_CHOICES]
        created = 0
        for i in range(count):
            provider = random.choice(providers)
            location = random.choice(locations) if locations else None
            circuit_id = f"CIR-{random.randint(10000000, 99999999)}"
            circuit_type = random.choice(circuit_types)
            line_speed = random.choice(line_speeds)
            handoff = random.choice(handoff_types)
            DataCircuit.objects.create(
                provider=provider,
                location=location,
                circuit_id=circuit_id,
                alternate_cid=f"ALT-{random.randint(100000, 999999)}" if random.random() > 0.6 else None,
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
                contract_id=f"CON-{random.randint(100000, 999999)}" if random.random() > 0.6 else None,
                foc_date=date.today() - timedelta(days=random.randint(30, 365))
                if random.random() > 0.5
                else None,
                ttu_date=date.today() - timedelta(days=random.randint(0, 180))
                if random.random() > 0.5
                else None,
                monthly_cost=Decimal(str(round(random.uniform(100, 3000), 2))),
                notes=random.choice(FAKE_SENTENCES) if random.random() > 0.8 else None,
            )
            created += 1
        return created
