"""
Secure file validators for asset uploads (images and attachments).

Mitigates:
- Malicious executables / script uploads: strict extension whitelist.
- DoS / storage abuse: max file size limits.
- Path traversal / overwrites: optional safe upload_to with UUID filenames.
"""

import os
import uuid

from django.core.exceptions import ValidationError

# Image extensions only (for AssetImage)
ALLOWED_IMAGE_EXTENSIONS = frozenset({".png", ".jpg", ".jpeg", ".gif", ".webp"})

# 5 MB max for asset images
MAX_ASSET_IMAGE_SIZE_BYTES = 5 * 1024 * 1024


def validate_asset_image_extension(value):
    """
    Validate that the uploaded file has an allowed image extension.

    Prevents non-image or disguised files (e.g. .exe renamed to .jpg).
    """
    if not value or not value.name:
        return
    ext = os.path.splitext(value.name)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_IMAGE_EXTENSIONS))
        raise ValidationError(
            f"Image type “{ext or '(none)'}” is not allowed. Allowed: {allowed}.",
            code="invalid_extension",
        )


def validate_asset_image_size(value):
    """Reject images that exceed the size limit (DoS and storage)."""
    if not value or value.size is None:
        return
    if value.size > MAX_ASSET_IMAGE_SIZE_BYTES:
        max_mb = MAX_ASSET_IMAGE_SIZE_BYTES // (1024 * 1024)
        raise ValidationError(
            f"Image is too large. Maximum size is {max_mb} MB.",
            code="file_too_large",
        )


def asset_image_upload_to(instance, filename):
    """
    Generate a safe storage path for asset images.

    Uses UUID in the filename so user-supplied names are never used
    (prevents path traversal and overwrites). Only whitelisted image
    extension is appended.
    """
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        ext = ".png"
    safe_name = f"{uuid.uuid4().hex}{ext}"
    return f"assets/images/{safe_name}"
