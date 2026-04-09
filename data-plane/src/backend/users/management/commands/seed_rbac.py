"""
Seed PermissionBundles from `rbac_permission_bundles.json`.

Expected role format:
{
  "bundle_name": "Assets Read All",
  "app_label": "assets",
  "permission_codenames": ["view_asset", "view_assetcategory", ...]
}

Run: python manage.py seed_rbac
Safe to run multiple times (idempotent).
"""

import json
import os

from django.contrib.auth.models import Permission
from django.core.management.base import BaseCommand

from users.models import PermissionBundle


class Command(BaseCommand):
    help = "Create permission bundles and role groups from rbac_permission_bundles.json."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Only print what would be created.",
        )

    @staticmethod
    def _bundle_code(bundle_name: str) -> str:
        return bundle_name.strip().lower().replace(" ", "_")

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        config_path = os.path.join(
            os.path.dirname(__file__),
            "rbac_permission_bundles.json",
        )
        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)

        configured_apps = {
            app.get("app_label") for app in config.get("apps", []) if app.get("app_label")
        }
        roles = config.get("roles", [])

        # Error handling
        if not configured_apps:
            raise RuntimeError("rbac_permission_bundles.json must define at least one app")
        if not roles:
            raise RuntimeError("rbac_permission_bundles.json must define at least one role")

        all_permissions = list(Permission.objects.select_related("content_type"))
        perms_by_app_and_codename = {
            (p.content_type.app_label, p.codename): p for p in all_permissions
        }

        group_bundle_codes: dict[str, list[str]] = {}
        verb = "Would create" if dry_run else "Creating"

        for role in roles:
            bundle_name = (role.get("bundle_name") or "").strip()
            app_label = (role.get("app_label") or "").strip()
            requested_codenames = role.get("permission_codenames")

            matched_permissions = []

            for codename in requested_codenames:
                perm = perms_by_app_and_codename.get((app_label, codename))
                if perm:
                    matched_permissions.append(perm)

            bundle_code = self._bundle_code(bundle_name)
            group_bundle_codes.setdefault(bundle_name, []).append(bundle_code)

            if dry_run:
                self.stdout.write(
                    f"  {verb} bundle: {bundle_name} ({bundle_code}) "
                    f"app={app_label} perms={len(matched_permissions)}"
                )
                continue

            bundle, _ = PermissionBundle.objects.get_or_create(
                code=bundle_code,
                defaults={
                    "name": bundle_name,
                    "app": app_label,
                    "description": None,
                },
            )
            bundle.name = bundle_name
            bundle.app = app_label
            bundle.description = None
            bundle.save(update_fields=["name", "app", "description"])
            bundle.permissions.set(matched_permissions)
            self.stdout.write(self.style.SUCCESS(f"  Bundle: {bundle_name} ({bundle_code})"))

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run — no changes made."))
            return
