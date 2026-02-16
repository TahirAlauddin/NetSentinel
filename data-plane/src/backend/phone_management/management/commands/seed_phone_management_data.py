"""
Django management command to seed fake data for Phone Management (blocks and managed numbers).

Requires at least one Location (e.g. from infrastructure). Optionally uses existing users
for assigned_user on managed numbers.

Usage:
  python manage.py seed_phone_management_data
  python manage.py seed_phone_management_data --blocks 5 --numbers 30
  python manage.py seed_phone_management_data --clear
"""

import random

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from infrastructure.models import Location

from phone_management.models import ManagedPhoneNumber, ManagedPhoneNumberBlock

# Static fake data (no Faker dependency)
FAKE_BLOCK_NAMES = [
    "HQ Main Block",
    "Support Range",
    "Sales Direct Block",
    "Conference Block",
    "Reception Range",
    "DevOps Utah Block",
    "Branch A Block",
    "Branch B Block",
]
FAKE_NUMBER_NAMES = [
    "Reception",
    "Support Line",
    "Sales Direct",
    "Fax Main",
    "IVR Main",
    "Ring Group 1",
    "Forwarder Main",
    "Extension 100",
    "Extension 101",
    "DevOps Line",
]
FAKE_NOTES = [
    "Primary line for this location.",
    "Backup / overflow.",
    "Used for external DID.",
    None,
    None,
]

User = get_user_model()
SERVICE_TYPES = [c[0] for c in ManagedPhoneNumber.SERVICE_TYPE_CHOICES]


class Command(BaseCommand):
    help = "Seed fake number blocks and managed phone numbers for Phone Management"

    def add_arguments(self, parser):
        parser.add_argument(
            "--blocks",
            type=int,
            default=5,
            help="Number of blocks to create (default: 5)",
        )
        parser.add_argument(
            "--numbers",
            type=int,
            default=25,
            help="Number of managed numbers to create (default: 25)",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete existing phone management data before seeding",
        )
        parser.add_argument(
            "--no-input",
            action="store_true",
            help="Do not prompt when using --clear",
        )

    def handle(self, *args, **options):
        locations = list(Location.objects.all()[:50])
        if not locations:
            self.stdout.write(
                self.style.ERROR(
                    "No locations found. Create at least one Location (e.g. infrastructure) first."
                )
            )
            return

        if options["clear"]:
            self._clear_data(options["no_input"])
            if options["blocks"] == 0 and options["numbers"] == 0:
                return

        block_count = options["blocks"]
        number_count = options["numbers"]
        users = list(User.objects.filter(is_active=True)[:20])

        if block_count > 0:
            self.stdout.write("Creating number blocks...")
            created_blocks = self._create_blocks(locations, block_count)
            self.stdout.write(self.style.SUCCESS(f"  Created {created_blocks} blocks"))

        if number_count > 0:
            self.stdout.write("Creating managed numbers...")
            created_numbers = self._create_numbers(
                locations=locations,
                users=users,
                count=number_count,
            )
            self.stdout.write(self.style.SUCCESS(f"  Created {created_numbers} managed numbers"))

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone. Blocks: {ManagedPhoneNumberBlock.objects.count()}, "
                f"Managed numbers: {ManagedPhoneNumber.objects.count()}"
            )
        )

    def _clear_data(self, no_input):
        block_count = ManagedPhoneNumberBlock.objects.count()
        number_count = ManagedPhoneNumber.objects.count()
        if block_count == 0 and number_count == 0:
            self.stdout.write("No phone management data to clear.")
            return
        if not no_input:
            confirm = input(
                f"Delete {number_count} managed numbers and {block_count} blocks? [y/N]: "
            )
            if confirm.lower() != "y":
                self.stdout.write("Aborted.")
                return
        ManagedPhoneNumber.objects.all().delete()
        ManagedPhoneNumberBlock.objects.all().delete()
        self.stdout.write(
            self.style.WARNING("Cleared all phone management blocks and managed numbers.")
        )

    def _create_blocks(self, locations, count):
        created = 0
        area = 312
        # Use distinct prefixes to avoid overlap with numbers we'll create
        prefix_base = 600
        for i in range(count):
            location = random.choice(locations)
            name = (
                FAKE_BLOCK_NAMES[i % len(FAKE_BLOCK_NAMES)]
                if i < len(FAKE_BLOCK_NAMES)
                else f"Block {i + 1}"
            )
            if (count > len(FAKE_BLOCK_NAMES)) and i >= len(FAKE_BLOCK_NAMES):
                name = f"{name} #{i + 1}"
            start = (prefix_base + i) * 10000
            start_number = f"+1-{area}-{start // 10000}-{start % 10000:04d}"
            end_number = f"+1-{area}-{start // 10000}-{(start % 10000) + 99:04d}"
            ManagedPhoneNumberBlock.objects.create(
                location=location,
                name=name,
                start_number=start_number,
                end_number=end_number,
                is_static_assignment=random.choice([True, True, False]),
                notes=random.choice(FAKE_NOTES),
            )
            created += 1
        return created

    def _create_numbers(self, locations, users, count):
        created = 0
        area = 312
        # Avoid overlapping with block ranges (600+) by using 200–599 for exchange
        used_numbers = set()
        for i in range(count):
            location = random.choice(locations)
            exchange = random.randint(200, 599)
            suffix = random.randint(1000, 9999)
            number = f"+1-{area}-{exchange}-{suffix}"
            while number in used_numbers:
                exchange = random.randint(200, 599)
                suffix = random.randint(1000, 9999)
                number = f"+1-{area}-{exchange}-{suffix}"
            used_numbers.add(number)

            name = (
                FAKE_NUMBER_NAMES[i % len(FAKE_NUMBER_NAMES)]
                if i < len(FAKE_NUMBER_NAMES)
                else f"Number {i + 1}"
            )
            if count > len(FAKE_NUMBER_NAMES) and i >= len(FAKE_NUMBER_NAMES):
                name = f"{name} #{i + 1}"

            assigned_user = random.choice(users) if users and random.random() > 0.5 else None
            ext = str(100 + (i % 900)) if random.random() > 0.3 else None
            did_enabled = random.choice([True, False])
            service_type = random.choice(SERVICE_TYPES)
            service_config = {}
            if service_type == "ivr" and random.random() > 0.5:
                service_config = {
                    "welcome_message": "Thank you for calling. Press 1 for Sales, 2 for Support.",
                    "timeout_seconds": 10,
                    "timeout_action": "voicemail",
                    "menu": [
                        {"key": "1", "label": "Sales", "action": "transfer:101"},
                        {"key": "2", "label": "Support", "action": "transfer:102"},
                    ],
                }
            elif service_type == "forwarder" and random.random() > 0.5:
                service_config = {"destination": f"+1-{area}-555-{random.randint(1000, 9999)}"}
            elif service_type == "ring_group" and random.random() > 0.5:
                service_config = {
                    "member_extensions": ["101", "102", "103"],
                    "strategy": random.choice(["sequential", "simultaneous"]),
                    "timeout_seconds": 20,
                }
            elif service_type == "fax" and random.random() > 0.5:
                service_config = {"retry_count": 3}
            ManagedPhoneNumber.objects.create(
                number=number,
                location=location,
                assigned_user=assigned_user,
                name=name,
                extension_number=ext,
                service_type=service_type,
                did_enabled=did_enabled,
                did_external_number=number if did_enabled and random.random() > 0.5 else None,
                service_config=service_config,
                notes=random.choice(FAKE_NOTES),
            )
            created += 1
        return created
