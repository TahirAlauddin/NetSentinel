"""
Seed PermissionBundles and ExtendedGroup from `rbac_permission_bundles.json`.

- per_app: one bundle per entry (`app_label` + `bundle` with fixed code/name).
- global: one role with many bundles (`app_labels` + `bundles` map per app).

Run: python manage.py seed_rbac

Safe to run multiple times (idempotent).
"""

import json
import os

from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand

from users.models import ExtendedGroup, PermissionBundle


class Command(BaseCommand):
    help = "Create permission bundles and role groups from rbac_permission_bundles.json."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Only print what would be created.",
        )

    @staticmethod
    def _role_key(role: dict) -> str:
        name = role.get("bundle_name")
        if not name:
            raise RuntimeError("Each role must set 'bundle_name'.")
        return name

    def _iter_bundle_targets(
        self,
        role: dict,
        display_by_label: dict[str, str],
        by_app: dict[str, list],
    ):
        """Yield (app_label, app_display, code, name) for each bundle this role defines."""
        scope = role.get("scope", "per_app")
        bundles_map = role.get("bundles") or {}

        if scope == "global":
            for app_label in role.get("app_labels") or []:
                if app_label not in by_app:
                    self.stdout.write(
                        self.style.WARNING(
                            f"  Skip app '{app_label}' for role '{self._role_key(role)}': "
                            "no permissions in auth_permission."
                        )
                    )
                    continue
                info = bundles_map.get(app_label)
                if not info or not info.get("code"):
                    self.stdout.write(
                        self.style.WARNING(
                            f"  Missing bundle entry for role '{self._role_key(role)}' "
                            f"app={app_label}."
                        )
                    )
                    continue
                display = display_by_label.get(app_label) or app_label.replace("_", " ").title()
                yield app_label, display, info["code"], info["name"]
            return

        app_label = role.get("app_label")
        if not app_label:
            raise RuntimeError(
                f"Role '{self._role_key(role)}' with scope per_app must set 'app_label'."
            )
        if app_label not in by_app:
            self.stdout.write(
                self.style.WARNING(
                    f"  Skip role '{self._role_key(role)}': app '{app_label}' has no "
                    "permissions in auth_permission."
                )
            )
            return

        b = role.get("bundle")
        if not b:
            raise RuntimeError(f"Role '{self._role_key(role)}' must define 'bundle'.")
        display = display_by_label.get(app_label) or app_label.replace("_", " ").title()
        if b.get("code_template"):
            code = b["code_template"].format(app=app_label)
            name = b["name_template"].format(
                app=app_label,
                app_title=app_label.replace("_", " ").title(),
                app_display=display,
            )
        elif b.get("code") and b.get("name"):
            code, name = b["code"], b["name"]
        else:
            raise RuntimeError(
                f"Role '{self._role_key(role)}' bundle needs 'code'/'name' or "
                "'code_template'/'name_template'."
            )
        yield app_label, display, code, name

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        config_path = os.path.join(
            os.path.dirname(__file__),
            "rbac_permission_bundles.json",
        )
        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)

        version = config.get("version")
        if version is not None and version != 2:
            self.stdout.write(
                self.style.WARNING(
                    f"rbac_permission_bundles.json version is {version}; "
                    "this command expects version 2."
                )
            )

        configured_apps = config.get("apps", [])
        roles = config.get("roles", [])
        if not configured_apps:
            raise RuntimeError("rbac_permission_bundles.json must define at least one app")
        if not roles:
            raise RuntimeError("rbac_permission_bundles.json must define at least one role")

        verb = "Would create" if dry_run else "Creating"

        perms = list(Permission.objects.select_related("content_type"))
        by_app: dict[str, list] = {}
        for p in perms:
            app_label = p.content_type.app_label
            by_app.setdefault(app_label, []).append(p)

        app_configs = []
        for app_cfg in configured_apps:
            app_label = app_cfg.get("app_label")
            if not app_label:
                continue
            app_display = app_cfg.get("display_name") or app_label.replace("_", " ").title()
            if app_label not in by_app:
                self.stdout.write(
                    self.style.WARNING(
                        f"  Skip app '{app_label}': no permissions found in auth_permission."
                    )
                )
                continue
            app_configs.append({"app_label": app_label, "display_name": app_display})

        display_by_label = {c["app_label"]: c["display_name"] for c in app_configs}

        role_targets = {}
        role_bundle_codes = {}
        for role in roles:
            key = self._role_key(role)
            targets = list(self._iter_bundle_targets(role, display_by_label, by_app))
            role_targets[key] = targets
            role_bundle_codes[key] = [t[2] for t in targets]

        for role in roles:
            group_name = self._role_key(role)
            prefixes = role.get("permission_codename_prefixes", [])
            include_unknown = role.get("include_unknown_codenames_for_safety", False)
            role_description = (role.get("description") or "").strip() or None

            for app_label, _app_display, code, name in role_targets[group_name]:
                app_perms = by_app[app_label]
                matched = [
                    p for p in app_perms if any(p.codename.startswith(pref) for pref in prefixes)
                ]
                perms_to_assign = app_perms if include_unknown else matched

                if dry_run:
                    self.stdout.write(
                        f"  {verb} bundle: {name} ({code}) role={group_name} "
                        f"app={app_label} perms={len(perms_to_assign)}"
                    )
                    continue

                bundle, _ = PermissionBundle.objects.get_or_create(
                    code=code,
                    defaults={
                        "name": name,
                        "app": app_label,
                        "description": role_description,
                    },
                )
                bundle.name = name
                bundle.app = app_label
                bundle.description = role_description
                bundle.save(update_fields=["name", "app", "description"])
                bundle.permissions.set(perms_to_assign)
                self.stdout.write(self.style.SUCCESS(f"  Bundle: {name} ({code})"))

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run — no changes made."))
            return

        for role in roles:
            group_name = self._role_key(role)
            group, _ = Group.objects.get_or_create(name=group_name)
            ext, _ = ExtendedGroup.objects.get_or_create(group=group)
            codes = role_bundle_codes[group_name]
            bundles = PermissionBundle.objects.filter(code__in=codes)
            ext.bundles.set(bundles)

            self.stdout.write(
                self.style.SUCCESS(
                    f"  Extended group '{group_name}' has {bundles.count()} bundle(s)."
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                "Done. user.has_perm() will include bundle permissions from ExtendedGroup roles."
            )
        )
