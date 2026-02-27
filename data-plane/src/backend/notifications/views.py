from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import InAppNotification, NotificationConfig
from .serializers import InAppNotificationSerializer, NotificationConfigSerializer
from .services import send_notification


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


class InAppNotificationListView(APIView):
    """
    GET: list recent in-app notifications (global, not per-user).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            limit = int(request.query_params.get("limit", "20"))
        except ValueError:
            limit = 20
        limit = max(1, min(limit, 100))

        qs = InAppNotification.objects.all().order_by("-created_at")[:limit]
        serializer = InAppNotificationSerializer(qs, many=True)
        return Response(serializer.data)


class InAppNotificationTestView(APIView):
    """
    Deprecated: test in-app notification endpoint removed from frontend polling.
    Kept temporarily for backward compatibility; consider removing if unused.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response(
            {"detail": "In-app test endpoint is disabled."},
            status=status.HTTP_410_GONE,
        )
