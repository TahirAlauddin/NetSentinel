from django.contrib import admin
from .models import InAppNotification, NotificationConfig, NotificationReadReceipt


@admin.register(NotificationConfig)
class NotificationConfigAdmin(admin.ModelAdmin):
    list_display = ("user", "slack_enabled", "discord_enabled", "updated_at")
    list_filter = ("slack_enabled", "discord_enabled")
    search_fields = ("user__email",)
    raw_id_fields = ("user",)


@admin.register(InAppNotification)
class InAppNotificationAdmin(admin.ModelAdmin):
    list_display = ("id", "type", "title", "created_at")
    list_filter = ("type",)
    search_fields = ("title", "message")
    readonly_fields = ("created_at",)


@admin.register(NotificationReadReceipt)
class NotificationReadReceiptAdmin(admin.ModelAdmin):
    list_display = ("user", "notification", "read_at")
    list_filter = ("read_at",)
    raw_id_fields = ("user", "notification")
