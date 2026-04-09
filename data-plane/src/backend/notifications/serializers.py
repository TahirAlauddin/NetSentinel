from rest_framework import serializers

from .models import InAppNotification, NotificationConfig, NotificationReadReceipt


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
            "email_enabled",
            "email_recipient",
            "sms_enabled",
            "sms_recipient",
            "updated_at",
        ]
        extra_kwargs = {
            "slack_webhook_url": {"allow_blank": True},
            "discord_webhook_url": {"allow_blank": True},
            "slack_default_channel": {"allow_blank": True},
            "email_recipient": {"allow_blank": True},
            "sms_recipient": {"allow_blank": True},
        }


class InAppNotificationSerializer(serializers.ModelSerializer):
    read = serializers.SerializerMethodField()

    class Meta:
        model = InAppNotification
        fields = [
            "id",
            "title",
            "message",
            "type",
            "link",
            "created_at",
            "read",
        ]

    def get_read(self, obj) -> bool:
        # Use annotated value from list view to avoid N+1
        if hasattr(obj, "read"):
            return bool(obj.read)
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return NotificationReadReceipt.objects.filter(
            user=request.user,
            notification=obj,
        ).exists()
