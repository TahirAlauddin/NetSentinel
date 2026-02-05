"""
Secure file validators for contract document uploads.

Mitigates common attacks:
- Path traversal: only whitelisted extensions and generated filenames in upload_to.
- Malicious executables: block .exe, .sh, .bat, .js, .vbs, .php, .py, etc.
- DoS via huge files: enforce max file size.
- Double extension / spoofing: validate extension against a strict whitelist.
"""

import os
import uuid

from django.core.exceptions import ValidationError


# Whitelist: only these extensions are allowed. No executables, scripts, or HTML.
ALLOWED_CONTRACT_EXTENSIONS = frozenset(
    {
        ".pdf",
        ".doc",
        ".docx",
        ".odt",
        ".txt",
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
    }
)

# 10 MB max for contract documents
MAX_CONTRACT_FILE_SIZE_BYTES = 10 * 1024 * 1024


def validate_contract_file_extension(value):
    """
    Validate that the uploaded file has an allowed extension.

    Prevents execution of scripts or binaries (e.g. .exe, .sh, .php, .js).
    """
    if not value or not value.name:
        return
    ext = os.path.splitext(value.name)[1].lower()
    if ext not in ALLOWED_CONTRACT_EXTENSIONS:
        allowed = ", ".join(sorted(ALLOWED_CONTRACT_EXTENSIONS))
        raise ValidationError(
            f"File type “{ext or '(none)'}” is not allowed. Allowed types: {allowed}.",
            code="invalid_extension",
        )


def validate_contract_file_size(value):
    """Reject files that exceed the size limit to prevent DoS and storage abuse."""
    if not value or value.size is None:
        return
    if value.size > MAX_CONTRACT_FILE_SIZE_BYTES:
        max_mb = MAX_CONTRACT_FILE_SIZE_BYTES // (1024 * 1024)
        raise ValidationError(
            f"File is too large. Maximum size is {max_mb} MB.",
            code="file_too_large",
        )


def contract_document_upload_to(instance, filename):
    """
    Generate a safe storage path for the contract document.

    - Uses date-based directory (contracts/YYYY/MM/) to avoid huge flat dirs.
    - Uses UUID for the filename so we never trust user-supplied names (prevents
      path traversal, overwrites, and executable names).
    - Appends only a whitelisted extension derived from the original file;
      if the extension was invalid, the validator would have already rejected the file.
    """
    from datetime import date

    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_CONTRACT_EXTENSIONS:
        ext = ".bin"
    safe_name = f"{uuid.uuid4().hex}{ext}"
    d = getattr(instance, "start_date", None) or date.today()
    return f"contracts/{d:%Y/%m}/{safe_name}"
