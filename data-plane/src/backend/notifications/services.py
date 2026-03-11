"""
Notification delivery service.

Sends messages to Slack, Discord, Email, and SMS when alerts are triggered.
"""

import json
import logging
from typing import Optional
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

from .models import NotificationConfig

logger = logging.getLogger(__name__)

# Single hardcoded email template for notifications (no user customization).
DEFAULT_EMAIL_SUBJECT_PREFIX = "[NetSentinel] "


def _url_host(url: str) -> str:
    """Return host part of URL for logging (no path or query)."""
    try:
        from urllib.parse import urlparse
        p = urlparse(url)
        return p.netloc or "(empty)"
    except Exception:
        return "(parse error)"


def get_channel_config(user=None):
    """
    Get notification config: user-specific if user given, else system-wide.
    When user is None and no system-wide config exists, use the most recently
    updated config (so UI-saved webhooks are used for background alerts).
    """
    if user:
        try:
            return NotificationConfig.objects.get(user=user)
        except NotificationConfig.DoesNotExist:
            pass
    try:
        return NotificationConfig.objects.get(user__isnull=True)
    except NotificationConfig.DoesNotExist:
        pass
    # Fallback: use most recently updated config so alerts use UI-saved webhooks
    return NotificationConfig.objects.order_by("-updated_at").first()


# User-Agent some webhook providers (e.g. Discord) reject default Python urllib
_WEBHOOK_HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "NetSentinel-Webhook/1.0",
}


def _post_json(url: str, payload: dict, timeout: int = 10) -> bool:
    """POST JSON to URL; return True on success."""
    if not url or not url.strip():
        return False
    data = json.dumps(payload).encode("utf-8")
    req = Request(url, data=data, method="POST", headers=_WEBHOOK_HEADERS)
    try:
        with urlopen(req, timeout=timeout) as r:
            return 200 <= r.status < 300
    except HTTPError as e:
        try:
            body = e.read().decode("utf-8", errors="replace").strip()[:800]
            logger.warning(
                "Webhook POST failed: %s %s — %s (url host: %s)",
                e.code,
                e.reason,
                body,
                _url_host(url),
            )
        except Exception:
            logger.warning("Webhook POST failed: %s", e)
        return False
    except (URLError, OSError) as e:
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


def send_sms_message(to_number: str, body: str) -> bool:
    """
    Send an SMS using the Twilio Python SDK.

    Sender phone number and credentials are read from Django settings:
    - TWILIO_ACCOUNT_SID
    - TWILIO_AUTH_TOKEN
    - TWILIO_PHONE_NUMBER
    """
    if not to_number or not to_number.strip():
        return False

    from django.conf import settings
    from twilio.rest import Client

    account_sid = getattr(settings, "TWILIO_ACCOUNT_SID", "") or ""
    auth_token = getattr(settings, "TWILIO_AUTH_TOKEN", "") or ""
    from_number = getattr(settings, "TWILIO_PHONE_NUMBER", "") or ""

    if not (account_sid and auth_token and from_number):
        logger.warning("Twilio SMS configuration missing; check TWILIO_* settings.")
        return False

    try:
        client = Client(account_sid, auth_token)
        client.messages.create(
            to=to_number.strip(),
            from_=from_number,
            body=body[:1600],
        )
        return True
    except Exception as e:
        logger.warning("Twilio SMS send failed: %s", e)
        return False


def send_email_message(config: NotificationConfig, subject: str, body: str) -> bool:
    """
    Send an email using Django's configured email backend with a hardcoded template.
    """
    if not config.email_recipient:
        return False

    from django.core.mail import EmailMultiAlternatives
    from django.conf import settings

    if not subject.startswith(DEFAULT_EMAIL_SUBJECT_PREFIX):
        subject = f"{DEFAULT_EMAIL_SUBJECT_PREFIX}{subject}"
    full_body_text = body
    full_body_html = body.replace("\n", "<br>")
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@netsentinel.local")

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=full_body_text,
            from_email=from_email,
            to=[config.email_recipient],
        )
        msg.attach_alternative(full_body_html, "text/html")
        sent = msg.send(fail_silently=False)
        return bool(sent)
    except Exception as e:
        logger.warning("Email send failed: %s", e)
        return False


def send_notification(
    title: str,
    message: str,
    alert_type: str = "info",
    user=None,
) -> dict:
    """
    Send a notification to all enabled channels (Slack, Discord, Email, SMS) for the given config.

    alert_type: "info" | "warning" | "critical" | "success" | "recovery"
    Returns dict with slack_ok, discord_ok, email_ok, sms_ok.
    """
    config = get_channel_config(user=user)
    result = {"slack_ok": False, "discord_ok": False, "email_ok": False, "sms_ok": False}
    if not config:
        return result

    # Slack
    if config.slack_enabled and config.slack_webhook_url:
        text = f"*{title}*\n{message}"
        if alert_type in ("warning", "critical"):
            text = f":warning: {text}" if alert_type == "warning" else f":rotating_light: {text}"
        result["slack_ok"] = send_slack_message(config.slack_webhook_url, text)

    # Discord (content + embed so message is always visible)
    if config.discord_enabled and config.discord_webhook_url:
        color = 0x3498DB  # blue
        if alert_type == "warning":
            color = 0xF1C40F
        elif alert_type in ("critical", "error"):
            color = 0xE74C3C
        elif alert_type in ("success", "recovery"):
            color = 0x2ECC71
        content = f"**{title}**\n{message[:2000]}"
        embeds = [
            {
                "title": title,
                "description": message[:4000],
                "color": color,
            }
        ]
        result["discord_ok"] = send_discord_message(
            config.discord_webhook_url, content, embeds=embeds
        )

    # Email
    if config.email_enabled and config.email_recipient:
        subject = f"[{alert_type.upper()}] {title}"
        result["email_ok"] = send_email_message(config, subject, message)

    # SMS
    if getattr(config, "sms_enabled", False) and getattr(config, "sms_recipient", ""):
        sms_body = f"[{alert_type.upper()}] {title} — {message}"
        result["sms_ok"] = send_sms_message(config.sms_recipient, sms_body)

    return result
