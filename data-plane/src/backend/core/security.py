"""
Security utilities for input validation and sanitization.
Prevents command injection, path traversal, and other security vulnerabilities.
"""

import re
import ipaddress
from typing import Optional, Union


def sanitize_string(input_str: str, max_length: int = 10000) -> str:
    """
    Sanitize a string to prevent command injection and other attacks.

    Args:
        input_str: String to sanitize
        max_length: Maximum allowed length

    Returns:
        Sanitized string
    """
    if not isinstance(input_str, str):
        return ""

    # Remove dangerous characters
    dangerous_chars = [";", "|", "&", "`", "$", "(", ")", "{", "}", "[", "]", "<", ">"]
    sanitized = input_str
    for char in dangerous_chars:
        sanitized = sanitized.replace(char, "")

    # Remove null bytes
    sanitized = sanitized.replace("\0", "")

    # Remove control characters except newlines and tabs
    sanitized = re.sub(r"[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]", "", sanitized)

    # Limit length
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length]

    return sanitized.strip()


def validate_ip_address(ip_str: str) -> Optional[str]:
    """
    Validate and normalize an IP address.

    Args:
        ip_str: IP address string to validate

    Returns:
        Normalized IP address string if valid, None otherwise
    """
    if not isinstance(ip_str, str):
        return None

    # Sanitize input
    ip_str = ip_str.strip()

    # Remove any dangerous characters
    ip_str = sanitize_string(ip_str, max_length=45)  # IPv6 max length

    try:
        ip_obj = ipaddress.ip_address(ip_str)
        return str(ip_obj)
    except ValueError:
        return None


def validate_hostname(hostname: str, max_length: int = 253) -> Optional[str]:
    """
    Validate and sanitize a hostname/FQDN.

    Args:
        hostname: Hostname to validate
        max_length: Maximum length (FQDN max is 253)

    Returns:
        Sanitized hostname if valid, None otherwise
    """
    if not isinstance(hostname, str):
        return None

    # Sanitize input
    hostname = sanitize_string(hostname, max_length=max_length)

    if not hostname:
        return None

    # Basic hostname validation (RFC 1123)
    # Allow letters, digits, hyphens, and dots
    if not re.match(
        r"^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$",
        hostname,
    ):
        return None

    # Check length
    if len(hostname) > max_length:
        return None

    # Each label (part between dots) should be max 63 chars
    labels = hostname.split(".")
    for label in labels:
        if len(label) > 63:
            return None

    return hostname.lower()


def validate_integer(
    value: Union[str, int], min_value: Optional[int] = None, max_value: Optional[int] = None
) -> Optional[int]:
    """
    Validate and convert a value to an integer.

    Args:
        value: Value to validate (string or int)
        min_value: Minimum allowed value
        max_value: Maximum allowed value

    Returns:
        Integer if valid, None otherwise
    """
    if isinstance(value, int):
        int_value = value
    elif isinstance(value, str):
        try:
            int_value = int(value)
        except (ValueError, TypeError):
            return None
    else:
        return None

    if min_value is not None and int_value < min_value:
        return None

    if max_value is not None and int_value > max_value:
        return None

    return int_value


def sanitize_filename(filename: str) -> str:
    """
    Sanitize a filename to prevent path traversal and command injection.

    Args:
        filename: Filename to sanitize

    Returns:
        Sanitized filename
    """
    if not isinstance(filename, str):
        return "file"

    # Remove path traversal attempts
    filename = filename.replace("..", "")
    filename = filename.replace("/", "_")
    filename = filename.replace("\\", "_")

    # Remove dangerous characters
    filename = sanitize_string(filename, max_length=255)

    # Remove leading/trailing dots and spaces
    filename = filename.strip(". ")

    # Ensure it's not empty
    if not filename:
        return "file"

    return filename


def validate_search_query(query: str, max_length: int = 500) -> Optional[str]:
    """
    Validate a search query string.

    Args:
        query: Search query to validate
        max_length: Maximum length

    Returns:
        Sanitized query if valid, None otherwise
    """
    if not isinstance(query, str):
        return None

    # Sanitize but allow some characters for search
    sanitized = sanitize_string(query, max_length=max_length)

    if not sanitized or len(sanitized) < 1:
        return None

    return sanitized
