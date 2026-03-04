import logging

from django.db.models import Exists, OuterRef

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import InAppNotification, NotificationConfig, NotificationReadReceipt
from .serializers import InAppNotificationSerializer, NotificationConfigSerializer
from .services import get_channel_config, send_notification

logger = logging.getLogger(__name__)


def _get_config_for_user(user):
    config, _ = NotificationConfig.objects.get_or_create(
        user=user,
        defaults={
            "slack_enabled": False,
            "discord_enabled": False,
        },
    )
    return config


class NotificationConfigView(APIView):
    """
    GET: current user's notification config (Slack, Discord).
    PUT/PATCH: update config.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        config = _get_config_for_user(request.user)
        serializer = NotificationConfigSerializer(config)
        return Response(serializer.data)

    def put(self, request):
        config = _get_config_for_user(request.user)
        serializer = NotificationConfigSerializer(config, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request):
        config = _get_config_for_user(request.user)
        serializer = NotificationConfigSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class NotificationConfigTestView(APIView):
    """
    POST: send a test notification to one channel only.
    Query param: channel=slack | discord (required). Only that channel is triggered.
    Returns {"slack_ok": bool, "discord_ok": bool, "slack_error": str?, "discord_error": str?}.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        channel = (request.query_params.get("channel") or "").strip().lower()
        if channel not in ("slack", "discord"):
            return Response(
                {"detail": "Query param 'channel' is required and must be 'slack' or 'discord'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        config = get_channel_config(user=request.user)
        response = {
            "slack_ok": False,
            "discord_ok": False,
            "slack_error": None,
            "discord_error": None,
        }
        if not config:
            logger.info(
                "Notification test: no config for user %s — save settings first", request.user
            )
            response["slack_error"] = "no_config"
            response["discord_error"] = "no_config"
            return Response(response)

        if channel == "slack":
            if not config.slack_enabled:
                response["slack_error"] = "slack_disabled"
            elif not (config.slack_webhook_url or not config.slack_webhook_url.strip()):
                response["slack_error"] = "no_webhook"
            else:
                from .services import send_slack_message

                text = "*NetSentinel test notification*\nIf you see this, Slack notifications are working."
                response["slack_ok"] = send_slack_message(config.slack_webhook_url, text)
                if not response["slack_ok"]:
                    response["slack_error"] = "webhook_failed"
        else:  # discord
            if not config.discord_enabled:
                response["discord_error"] = "discord_disabled"
            elif not (config.discord_webhook_url or not config.discord_webhook_url.strip()):
                response["discord_error"] = "no_webhook"
            else:
                from .services import send_discord_message

                content = "**NetSentinel test notification**\nIf you see this, Discord notifications are working."
                embeds = [
                    {
                        "title": "NetSentinel test notification",
                        "description": "If you see this, Discord notifications are working.",
                        "color": 0x3498DB,
                    }
                ]
                response["discord_ok"] = send_discord_message(
                    config.discord_webhook_url, content, embeds=embeds
                )
                if not response["discord_ok"]:
                    response["discord_error"] = "webhook_failed"
        return Response(response)


def _in_app_queryset(request, *, unread_only: bool = False, limit: int = 20):
    """Base queryset for in-app notifications with read annotated for current user."""
    read_receipts = NotificationReadReceipt.objects.filter(
        user=request.user,
        notification=OuterRef("pk"),
    )
    qs = (
        InAppNotification.objects.all().order_by("-created_at").annotate(read=Exists(read_receipts))
    )
    if unread_only:
        qs = qs.filter(read=False)
    return qs[:limit]


class InAppNotificationListView(APIView):
    """
    GET: list in-app notifications for the current user.

    Query params:
    - unread_only: if "true", only return notifications the user has not read.
    - limit: max number to return (1-100). Default 20. Bell uses 5, view-all unread uses 50, history uses 50.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            limit = int(request.query_params.get("limit", "20"))
        except ValueError:
            limit = 20
        limit = max(1, min(limit, 100))
        unread_only = request.query_params.get("unread_only", "").lower() == "true"

        qs = _in_app_queryset(request, unread_only=unread_only, limit=limit)
        serializer = InAppNotificationSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)


class InAppNotificationMarkReadView(APIView):
    """POST: mark a single in-app notification as read for the current user."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        notification = InAppNotification.objects.filter(pk=pk).first()
        if not notification:
            return Response(
                {"detail": "Not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        NotificationReadReceipt.objects.get_or_create(
            user=request.user,
            notification=notification,
        )
        return Response({"ok": True})


class InAppNotificationMarkUnreadView(APIView):
    """POST: mark a single in-app notification as unread for the current user (removes read receipt)."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        notification = InAppNotification.objects.filter(pk=pk).first()
        if not notification:
            return Response(
                {"detail": "Not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        deleted, _ = NotificationReadReceipt.objects.filter(
            user=request.user,
            notification=notification,
        ).delete()
        return Response({"ok": True, "removed": deleted > 0})


class InAppNotificationMarkAllReadView(APIView):
    """POST: mark all in-app notifications as read for the current user."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        unread_ids = list(
            _in_app_queryset(request, unread_only=True, limit=1000).values_list("id", flat=True)
        )
        existing = set(
            NotificationReadReceipt.objects.filter(
                user=request.user,
                notification_id__in=unread_ids,
            ).values_list("notification_id", flat=True)
        )
        to_create = [
            NotificationReadReceipt(user=request.user, notification_id=nid)
            for nid in unread_ids
            if nid not in existing
        ]
        NotificationReadReceipt.objects.bulk_create(to_create)
        return Response({"ok": True, "marked_count": len(to_create)})


class InAppNotificationCreateTestView(APIView):
    """
    POST: create a single in-app notification for testing (desktop notifications, DND, etc.).
    Body (optional): title, message, type (info|warning|error|success). Defaults: test title/message.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        from django.utils import timezone

        title = (request.data.get("title") or "Test notification").strip()[:255]
        message = (request.data.get("message") or "").strip()[:2000]
        notif_type = (request.data.get("type") or "info").strip().lower()
        if notif_type not in ("info", "warning", "error", "success"):
            notif_type = "info"
        link = (request.data.get("link") or "").strip()[:2000]
        notification = InAppNotification.objects.create(
            title=title or "Test notification",
            message=message or f"Created at {timezone.now().isoformat()} for testing.",
            type=notif_type,
            link=link or "",
            user=request.user,
        )
        serializer = InAppNotificationSerializer(notification, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
