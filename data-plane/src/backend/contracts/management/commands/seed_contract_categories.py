"""
Django management command to seed contract categories.
Usage: python manage.py seed_contract_categories
"""

from django.core.management.base import BaseCommand

from contracts.models import ContractCategory

CONTRACT_CATEGORY_NAMES = [
    "Advertising",
    "Analytics",
    "Cloud",
    "Customer Support",
    "Developer Tools",
    "DevOps",
    "Facilities",
    "Finance and Accounting",
    "General",
    "HR",
    "Infrastructure",
    "IT and Security",
    "Marketing",
    "Onboarding/Offboarding",
    "Other",
    "Product and Design",
    "Productivity",
    "Sales and Business",
    "Telecom",
    "Uncategorized",
]


class Command(BaseCommand):
    help = "Seed contract categories"

    def handle(self, *args, **options):
        self.stdout.write("Creating contract categories...")
        for name in CONTRACT_CATEGORY_NAMES:
            _, created = ContractCategory.objects.get_or_create(name=name, defaults={"name": name})
            status = "Created" if created else "Already exists"
            self.stdout.write(self.style.SUCCESS(f"  {status}: {name}"))
        self.stdout.write(
            self.style.SUCCESS(f"\n✅ Seeding complete! Total: {ContractCategory.objects.count()}")
        )
