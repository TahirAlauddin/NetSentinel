"""
Django management command to seed vendors from JSON file.
Usage: python manage.py seed_vendors
"""

import json
from pathlib import Path
from django.core.management.base import BaseCommand
from assets.models import Vendor


class Command(BaseCommand):
    help = "Seed vendors from vendors.json file"

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            default="vendors.json",
            help="Path to vendors JSON file (relative to management/commands/)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be created without actually creating vendors",
        )

    def handle(self, *args, **options):
        """Load vendors from JSON and create them in the database."""
        # Get the path to the JSON file
        script_dir = Path(__file__).parent
        json_file = script_dir / options["file"]
        dry_run = options["dry_run"]

        if not json_file.exists():
            self.stdout.write(self.style.ERROR(f"❌ File not found: {json_file}"))
            self.stdout.write(
                self.style.WARNING(
                    "💡 Tip: Run 'python assets/management/commands/clean_vendors.py' first to generate vendors.json"
                )
            )
            return

        # Load JSON file
        try:
            with open(json_file, "r", encoding="utf-8") as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            self.stdout.write(self.style.ERROR(f"❌ Invalid JSON file: {e}"))
            return

        vendors = data.get("vendors", [])
        if not vendors:
            self.stdout.write(self.style.WARNING("⚠️  No vendors found in JSON file"))
            return

        self.stdout.write(f"📦 Found {len(vendors)} vendors in JSON file")

        if dry_run:
            self.stdout.write(
                self.style.WARNING("\n🔍 DRY RUN MODE - No vendors will be created\n")
            )

        created_count = 0
        skipped_count = 0
        error_count = 0

        for vendor_name in vendors:
            vendor_name = vendor_name.strip()

            if not vendor_name or len(vendor_name) < 2:
                skipped_count += 1
                continue

            try:
                if dry_run:
                    # Check if vendor exists
                    exists = Vendor.objects.filter(name__iexact=vendor_name).exists()
                    status = "Would create" if not exists else "Already exists"
                    self.stdout.write(f"  {status}: {vendor_name}")
                else:
                    vendor, created = Vendor.objects.get_or_create(
                        name=vendor_name, defaults={"name": vendor_name}
                    )

                    if created:
                        created_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(f"  ✅ Created: {vendor_name}")
                        )
                    else:
                        skipped_count += 1
                        self.stdout.write(
                            self.style.WARNING(f"  ⏭️  Skipped (exists): {vendor_name}")
                        )
            except Exception as e:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(f"  ❌ Error creating '{vendor_name}': {e}")
                )

        # Summary
        self.stdout.write("\n" + "=" * 50)
        if dry_run:
            self.stdout.write(self.style.WARNING("🔍 DRY RUN SUMMARY"))
        else:
            self.stdout.write(self.style.SUCCESS("✅ SEEDING SUMMARY"))
        self.stdout.write("=" * 50)
        self.stdout.write(f"Total vendors in file: {len(vendors)}")
        if not dry_run:
            self.stdout.write(f"Created: {created_count}")
        self.stdout.write(f"Skipped: {skipped_count}")
        if error_count > 0:
            self.stdout.write(self.style.ERROR(f"Errors: {error_count}"))

        if not dry_run:
            self.stdout.write(
                f"\n📊 Total vendors in database: {Vendor.objects.count()}"
            )
