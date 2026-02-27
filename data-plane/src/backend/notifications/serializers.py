from rest_framework import serializers

from .models import InAppNotification, NotificationConfig


class NotificationConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationConfig
        fields = [
            "id",
            "slack_enabled",
            "slack_webhook_url",
            "slack_default_channel",
            "discord_enabled",
            "discord_webhook_url",
            "updated_at",
        ]
        extra_kwargs = {
            "slack_webhook_url": {"allow_blank": True},
            "discord_webhook_url": {"allow_blank": True},
            "slack_default_channel": {"allow_blank": True},
        }


class InAppNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = InAppNotification
        fields = [
            "id",
            "title",
            "message",
            "type",
            "link",
            "created_at",
        ]
