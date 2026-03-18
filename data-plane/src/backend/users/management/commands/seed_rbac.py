"""
Seed example PermissionBundles and ExtendedGroup (Admin role with all bundles).
Run: python manage.py seed_rbac
Safe to run multiple times (idempotent).
"""

from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand

from users.models import ExtendedGroup, PermissionBundle


class Command(BaseCommand):
    help = "Create example permission bundles and an Admin role with all bundles."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Only print what would be created.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        verb = "Would create" if dry_run else "Creating"

        # Build app-scoped bundles from Django's permissions
        perms = list(Permission.objects.select_related("content_type"))
        by_app = {}
        for p in perms:
            app = p.content_type.app_label
            if app not in by_app:
                by_app[app] = []
            by_app[app].append(p)

        created_bundles = []
        for app_label in sorted(by_app.keys()):
            code = f"view_{app_label}"
            name = f"View {app_label.title()}"
            if dry_run:
                self.stdout.write(f"  {verb} bundle: {name} ({code})")
                created_bundles.append((code, name, by_app[app_label]))
                continue
            bundle, _ = PermissionBundle.objects.get_or_create(
                code=code,
                defaults={"name": name, "app": app_label},
            )
            bundle.permissions.set(by_app[app_label])
            created_bundles.append((code, name, by_app[app_label]))
            self.stdout.write(self.style.SUCCESS(f"  Bundle: {name} ({code})"))

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run — no changes made."))
            return

        # Admin group with all bundles
        admin_group, _ = Group.objects.get_or_create(name="Admin")
        ext, created = ExtendedGroup.objects.get_or_create(
            group=admin_group,
            defaults={},
        )
        ext.bundles.set(PermissionBundle.objects.all())
        self.stdout.write(
            self.style.SUCCESS(
                f"  Extended group 'Admin' has {PermissionBundle.objects.count()} bundle(s)."
            )
        )
        self.stdout.write(self.style.SUCCESS("Done. user.has_perm() will include bundle permissions."))
