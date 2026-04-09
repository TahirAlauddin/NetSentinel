"""
Django management command to create sample in-app notifications for testing.

Usage:
  python manage.py create_notifications
  python manage.py create_notifications --count 10
  python manage.py create_notifications --clear
"""

from django.core.management.base import BaseCommand

from notifications.models import InAppNotification

SAMPLE_NOTIFICATIONS = [
    {
        "type": "info",
        "title": "System update",
        "message": "NetSentinel has been updated to the latest version.",
    },
    {
        "type": "warning",
        "title": "Subnet threshold",
        "message": "Subnet 10.0.1.0/24 is at 85% utilization.",
    },
    {
        "type": "error",
        "title": "Device offline",
        "message": "Router core-01 has been unreachable for 2 minutes.",
    },
    {
        "type": "success",
        "title": "Backup completed",
        "message": "Nightly config backup finished successfully.",
    },
    {"type": "info", "title": "New IP request", "message": "IP request #42 is pending approval."},
    {
        "type": "warning",
        "title": "Certificate expiring",
        "message": "SSL certificate for api.example.com expires in 14 days.",
    },
    {
        "type": "error",
        "title": "High CPU",
        "message": "Backend server cpu-01 is above 95% for 5 minutes.",
    },
    {
        "type": "success",
        "title": "Deployment done",
        "message": "Release v2.1.0 deployed to production.",
    },
]


class Command(BaseCommand):
    help = "Create sample in-app notifications for testing the notification bell and history."

    def add_arguments(self, parser):
        parser.add_argument(
            "--count",
            type=int,
            default=0,
            help="Number of notifications to create (0 = use all samples).",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all in-app notifications before creating new ones.",
        )

    def handle(self, *args, **options):
        count = options["count"]
        clear = options["clear"]

        if clear:
            deleted, _ = InAppNotification.objects.all().delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted} existing notification(s)."))

        samples = SAMPLE_NOTIFICATIONS
        to_create = count if count > 0 else len(samples)
        to_create = min(to_create, len(samples))

        created = 0
        for i in range(to_create):
            data = samples[i % len(samples)]
            InAppNotification.objects.create(
                title=data["title"],
                message=data["message"],
                type=data["type"],
            )
            created += 1

        self.stdout.write(self.style.SUCCESS(f"Created {created} notification(s)."))
