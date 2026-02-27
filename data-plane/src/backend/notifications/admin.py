from django.contrib import admin
from .models import NotificationConfig


@admin.register(NotificationConfig)
class NotificationConfigAdmin(admin.ModelAdmin):
    list_display = ("user", "slack_enabled", "discord_enabled", "updated_at")
    list_filter = ("slack_enabled", "discord_enabled")
    search_fields = ("user__email",)
    raw_id_fields = ("user",)
