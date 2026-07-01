"""
Seed realistic contract records.

Usage:
  python manage.py seed_contract
  python manage.py seed_contract --count 25
  python manage.py seed_contract --clear --no-input
"""

import random
from datetime import timedelta
from decimal import Decimal

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.utils import timezone

from contracts.models import Contract, ContractCategory
from telecom.models import Provider

CARRIER_FALLBACKS = [
    "AT&T",
    "Verizon",
    "Lumen",
    "Comcast Business",
    "Zayo",
    "Cogent",
    "T-Mobile",
]


class Command(BaseCommand):
    help = "Seed realistic contracts linked to categories."

    def add_arguments(self, parser):
        parser.add_argument("--count", type=int, default=20, help="Number of contracts to create.")
        parser.add_argument("--clear", action="store_true", help="Delete existing contracts first.")
        parser.add_argument("--no-input", action="store_true", help="Do not prompt when using --clear.")

    def handle(self, *args, **options):
        call_command("seed_contract_categories")

        if options["clear"]:
            if not self._confirm_clear(options["no_input"]):
                return
            self._clear_data()

        count = options["count"]
        carriers = self._carrier_pool()
        categories = list(ContractCategory.objects.all())
        contract_types = [choice[0] for choice in Contract.CONTRACT_TYPE_CHOICES]

        if not categories:
            self.stdout.write(self.style.ERROR("No contract categories found."))
            return

        today = timezone.now().date()
        created = 0

        for i in range(count):
            carrier = random.choice(carriers)
            start_date = today - timedelta(days=random.randint(20, 900))
            contract_type = random.choice(contract_types)
            end_date = (
                start_date + timedelta(days=random.choice([365, 730, 1095]))
                if contract_type == "fixed_term"
                else None
            )
            contract_number = f"CTR-{today.year}-{i + 1:05d}"

            _, was_created = Contract.objects.get_or_create(
                carrier=carrier,
                contract_number=contract_number,
                defaults={
                    "date": start_date - timedelta(days=random.randint(1, 45)),
                    "nrc": Decimal(str(round(random.uniform(0, 25000), 2))),
                    "mrc": Decimal(str(round(random.uniform(75, 12000), 2))),
                    "contract_type": contract_type,
                    "start_date": start_date,
                    "end_date": end_date,
                    "category": random.choice(categories),
                },
            )
            if was_created:
                created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Created {created} contracts (requested {count}). Total: {Contract.objects.count()}"
            )
        )

    def _carrier_pool(self):
        providers = list(
            Provider.objects.exclude(name__isnull=True)
            .exclude(name__exact="")
            .values_list("name", flat=True)
            .distinct()
        )
        return providers or CARRIER_FALLBACKS

    def _confirm_clear(self, no_input):
        if no_input:
            return True
        confirm = input(f"Delete all {Contract.objects.count()} contracts? [y/N]: ")
        if confirm.lower() != "y":
            self.stdout.write("Aborted.")
            return False
        return True

    def _clear_data(self):
        Contract.objects.all().delete()
        self.stdout.write(self.style.WARNING("Cleared all contracts."))
