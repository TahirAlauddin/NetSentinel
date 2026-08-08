"""
Seed all major app data in a practical order.

Usage:
  python manage.py seed_all
  python manage.py seed_all --clear --no-input
"""

from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Seed infrastructure, assets, contracts, telecom, IPAM, and phone data."

    def add_arguments(self, parser):
        parser.add_argument("--clear", action="store_true", help="Clear data in dependent seeders.")
        parser.add_argument(
            "--no-input",
            action="store_true",
            help="Do not prompt when used with --clear.",
        )

    def handle(self, *args, **options):
        clear = options["clear"]
        no_input = options["no_input"]

        self.stdout.write("Seeding infrastructure...")
        call_command(
            "seed_infrastructure",
            locations=12,
            departments=8,
            contacts=18,
            circuits=20,
            clear=clear,
            no_input=no_input,
        )

        self.stdout.write("Seeding asset categories/vendors...")
        call_command("seed_asset_categories")
        call_command("seed_vendors")

        self.stdout.write("Seeding realistic assets...")
        call_command(
            "seed_assets", count=50, relations=20, alerts=24, clear=clear, no_input=no_input
        )

        self.stdout.write("Seeding contracts...")
        call_command("seed_contract", count=24, clear=clear, no_input=no_input)

        self.stdout.write("Seeding telecom data...")
        call_command(
            "seed_telecom",
            providers=6,
            services=20,
            circuits=22,
            phone_numbers=30,
            clear=clear,
            no_input=no_input,
        )

        self.stdout.write("Seeding IPAM data...")
        call_command("seed_ipam", subnets=16, ips_per_subnet=8, clear=clear, no_input=no_input)

        self.stdout.write("Seeding phone management data...")
        call_command(
            "seed_phone",
            blocks=8,
            numbers=35,
            clear=clear,
            no_input=no_input,
        )

        self.stdout.write(self.style.SUCCESS("All seed commands completed."))
