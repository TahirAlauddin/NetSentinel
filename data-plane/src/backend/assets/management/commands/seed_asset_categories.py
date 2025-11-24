"""
Django management command to seed asset categories and tech specs.
Usage: python manage.py seed_asset_categories
"""

from django.core.management.base import BaseCommand
from assets.models import TechSpecs, AssetCategory

# Tech Specs mapping (name -> table_name)
TECH_SPECS = {
    "Computer": "assets_computer_details",
    "Network": "assets_network_details",
    "Display": "assets_display_details",
    "Phone": "assets_phone_details",
    "Peripheral": "assets_peripheral_details",
}

# Asset categories mapping (category_name -> tech_specs_name)
CATEGORIES = {
    # Computer category
    "Apple Device": "Computer",
    "Desktop": "Computer",
    "Laptop": "Computer",
    "Server": "Computer",
    "Thin Client": "Computer",
    "Tablet": "Computer",
    # Network category
    "Firewall": "Network",
    "Router": "Network",
    "Switch": "Network",
    "Other": "Network",
    # Display category
    "TV": "Display",
    # Phone category
    "Phone": "Phone",
    "Phone System": "Phone",
    # Peripheral category
    "Dongle": "Peripheral",
    "Printer": "Peripheral",
    "Mobile": "Peripheral",
    "iPad": "Peripheral",
    "iPhone": "Peripheral",
    # Unrecognized (no tech specs)
    "Unrecognized": None,
}


class Command(BaseCommand):
    help = "Seed asset categories and tech specs"

    def handle(self, *args, **options):
        """Create tech specs and categories."""
        self.stdout.write("Creating Tech Specs...")
        tech_specs_objects = {}

        for name, table_name in TECH_SPECS.items():
            tech_spec, created = TechSpecs.objects.get_or_create(
                name=name, defaults={"name": name}
            )
            tech_specs_objects[name] = tech_spec
            status = "Created" if created else "Already exists"
            self.stdout.write(
                self.style.SUCCESS(f"  {status}: {name} -> {table_name}")
            )

        self.stdout.write("\nCreating Asset Categories...")
        for category_name, tech_specs_name in CATEGORIES.items():
            tech_specs_obj = (
                tech_specs_objects.get(tech_specs_name) if tech_specs_name else None
            )

            category, created = AssetCategory.objects.get_or_create(
                name=category_name, defaults={"tech_specs": tech_specs_obj}
            )

            # Update tech_specs if it was None before
            if not created and category.tech_specs != tech_specs_obj:
                category.tech_specs = tech_specs_obj
                category.save()

            status = "Created" if created else "Already exists"
            tech_info = f" -> {tech_specs_name}" if tech_specs_name else " (no tech specs)"
            self.stdout.write(
                self.style.SUCCESS(f"  {status}: {category_name}{tech_info}")
            )

        self.stdout.write(self.style.SUCCESS("\n✅ Seeding complete!"))
        self.stdout.write(f"Total Tech Specs: {TechSpecs.objects.count()}")
        self.stdout.write(f"Total Categories: {AssetCategory.objects.count()}")

