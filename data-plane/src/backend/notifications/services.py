"""
Notification delivery service.

Sends messages to Slack and Discord webhooks when alerts are triggered.
"""

import json
import logging
from typing import Optional
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

from .models import NotificationConfig

logger = logging.getLogger(__name__)


def get_channel_config(user=None):
    """
    Get notification config: user-specific if user given, else system-wide.
    """
    if user:
        try:
            return NotificationConfig.objects.get(user=user)
        except NotificationConfig.DoesNotExist:
            pass
    try:
        return NotificationConfig.objects.get(user__isnull=True)
    except NotificationConfig.DoesNotExist:
        return None


def _post_json(url: str, payload: dict, timeout: int = 10) -> bool:
    """POST JSON to URL; return True on success."""
    if not url or not url.strip():
        return False
    data = json.dumps(payload).encode("utf-8")
    req = Request(url, data=data, method="POST", headers={"Content-Type": "application/json"})
    try:
        with urlopen(req, timeout=timeout) as r:
            return 200 <= r.status < 300
    except (HTTPError, URLError, OSError) as e:
        logger.warning("Webhook POST failed: %s", e)
        return False


def send_slack_message(webhook_url: str, text: str, blocks: Optional[list] = None) -> bool:
    """
    POST a message to a Slack incoming webhook.
    """
    payload = {"text": text}
    if blocks:
        payload["blocks"] = blocks
    return _post_json(webhook_url, payload)


def send_discord_message(webhook_url: str, content: str, embeds: Optional[list] = None) -> bool:
    """
    POST a message to a Discord webhook.
    """
    if not webhook_url or not webhook_url.strip():
        return False
    payload = {"content": content[:2000]}
    if embeds:
        payload["embeds"] = embeds
    return _post_json(webhook_url, payload)


def send_notification(
    title: str,
    message: str,
    alert_type: str = "info",
    user=None,
) -> dict:
    """
    Send a notification to all enabled channels (Slack, Discord) for the given config.

    alert_type: "info" | "warning" | "critical" | "success" | "recovery"
    Returns dict with slack_ok, discord_ok.
    """
    config = get_channel_config(user=user)
    result = {"slack_ok": False, "discord_ok": False}
    if not config:
        return result

    # Slack
    if config.slack_enabled and config.slack_webhook_url:
        text = f"*{title}*\n{message}"
        if alert_type in ("warning", "critical"):
            text = f":warning: {text}" if alert_type == "warning" else f":rotating_light: {text}"
        result["slack_ok"] = send_slack_message(config.slack_webhook_url, text)

    # Discord
    if config.discord_enabled and config.discord_webhook_url:
        color = 0x3498DB  # blue
        if alert_type == "warning":
            color = 0xF1C40F
        elif alert_type in ("critical", "error"):
            color = 0xE74C3C
        elif alert_type in ("success", "recovery"):
            color = 0x2ECC71
        embeds = [
            {
                "title": title,
                "description": message[:4000],
                "color": color,
            }
        ]
        result["discord_ok"] = send_discord_message(
            config.discord_webhook_url, "", embeds=embeds
        )

    return result
