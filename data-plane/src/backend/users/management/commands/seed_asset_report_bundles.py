"""
Create PermissionBundles for each asset reporting permission.
Each bundle contains the single corresponding Django permission so admins can assign
e.g. "View Cost Report" as a bundle to groups. Run after migrating assets (AssetReport model).
Usage: python manage.py seed_asset_report_bundles
"""

from django.contrib.auth.models import Permission
from django.core.management.base import BaseCommand
from users.models import PermissionBundle

# codename -> (bundle code, human name)
REPORT_PERMISSIONS = [
    ("view_operating_system", "view_operating_system", "View Operating System report"),
    ("view_applications", "view_applications", "View Applications report"),
    ("view_availability", "view_availability", "View Availability report"),
    ("view_location", "view_location", "View Location report"),
    ("view_warranty", "view_warranty", "View Warranty report"),
    ("view_model", "view_model", "View Model report"),
    ("view_asset_type", "view_asset_type", "View Asset Type report"),
    ("view_department", "view_department", "View Department report"),
    ("view_cost", "view_cost", "View Cost report"),
    ("view_firmware", "view_firmware", "View Firmware report"),
]


class Command(BaseCommand):
    help = "Create permission bundles for asset reporting pages (one bundle per report type)."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Only print what would be created.")

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        verb = "Would create" if dry_run else "Creating"

        # Permissions live under content type assets | assetreport (AssetReport model)
        report_perms = {
            p.codename: p
            for p in Permission.objects.filter(
                content_type__app_label="assets", content_type__model="assetreport"
            )
        }

        for codename, bundle_code, bundle_name in REPORT_PERMISSIONS:
            perm = report_perms.get(codename)
            if not perm:
                self.stdout.write(self.style.WARNING(f"  Skip {codename}: permission not found (run assets migrations first)."))
                continue
            if dry_run:
                self.stdout.write(f"  {verb} bundle: {bundle_name} (code={bundle_code}) with permission {perm.codename}")
                continue
            bundle, created = PermissionBundle.objects.get_or_create(
                code=bundle_code,
                defaults={"name": bundle_name, "app": "assets"},
            )
            bundle.permissions.set([perm])
            self.stdout.write(self.style.SUCCESS(f"  Bundle: {bundle_name} (code={bundle_code})"))

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run — no changes made."))
