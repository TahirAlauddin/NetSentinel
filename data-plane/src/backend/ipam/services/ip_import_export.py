"""
IP Address Import/Export Service.

Handles bulk import and export of IP addresses from/to CSV and JSON formats.
"""

import csv
import json
from io import StringIO
from ipaddress import ip_address, ip_network
from typing import Any, Dict, List, Optional, Tuple

from django.db import transaction

from ..models import IPAddress, Subnet


class IPImportError(Exception):
    """Custom exception for IP import errors."""

    pass


def validate_ip_address(ip_str: str) -> bool:
    """
    Validate if a string is a valid IP address.

    Args:
        ip_str: String to validate

    Returns:
        True if valid IP address, False otherwise
    """
    try:
        ip_address(ip_str)
        return True
    except ValueError:
        return False


def validate_ip_in_subnet(ip_str: str, subnet_network: str) -> bool:
    """
    Validate if an IP address is within a subnet.

    Args:
        ip_str: IP address string
        subnet_network: Subnet network string (CIDR notation)

    Returns:
        True if IP is in subnet, False otherwise
    """
    try:
        ip = ip_address(ip_str)
        subnet = ip_network(subnet_network, strict=False)
        return ip in subnet
    except (ValueError, TypeError):
        return False


def parse_csv_import(csv_content: str) -> List[Dict[str, Any]]:
    """
    Parse CSV content into a list of dictionaries.

    Args:
        csv_content: CSV file content as string

    Returns:
        List of dictionaries with IP address data
    """
    reader = csv.DictReader(StringIO(csv_content))
    return list(reader)


def parse_json_import(json_content: str) -> List[Dict[str, Any]]:
    """
    Parse JSON content into a list of dictionaries.

    Args:
        json_content: JSON file content as string

    Returns:
        List of dictionaries with IP address data
    """
    data = json.loads(json_content)
    if isinstance(data, list):
        return data
    elif isinstance(data, dict) and "ip_addresses" in data:
        return data["ip_addresses"]
    else:
        raise IPImportError("JSON must be an array or object with 'ip_addresses' key")


def _validate_required_fields(row: Dict[str, Any], required_fields: List[str]) -> List[str]:
    """Validate required fields in a row."""
    errors = []
    for field in required_fields:
        if field not in row or not row[field]:
            errors.append(f"Missing required field: {field}")
    return errors


def _validate_ip_address_field(row: Dict[str, Any], valid_rows: List[Dict]) -> List[str]:
    """Validate IP address field."""
    errors = []
    if "address" in row and row["address"]:
        if not validate_ip_address(row["address"]):
            errors.append(f"Invalid IP address: {row['address']}")
        elif any(r.get("address") == row["address"] for r in valid_rows):
            errors.append(f"Duplicate IP address in import: {row['address']}")
    return errors


def _validate_subnet_field(row: Dict[str, Any]) -> List[str]:
    """Validate subnet field."""
    errors = []
    if "subnet" in row and row["subnet"]:
        try:
            subnet_id = int(row["subnet"])
            subnet = Subnet.objects.filter(id=subnet_id).first()
            if not subnet:
                errors.append(f"Subnet with ID {subnet_id} not found")
            elif "address" in row and row["address"]:
                if not validate_ip_in_subnet(row["address"], subnet.network):
                    errors.append(f"IP {row['address']} is not in subnet {subnet.network}")
        except (ValueError, TypeError):
            errors.append(f"Invalid subnet ID: {row.get('subnet')}")
    return errors


def _validate_status_field(row: Dict[str, Any]) -> List[str]:
    """Validate status field."""
    errors = []
    if "status" in row and row["status"]:
        valid_statuses = ["available", "reserved", "assigned", "dhcp", "deprecated"]
        if row["status"] not in valid_statuses:
            errors.append(f"Invalid status: {row['status']}. Must be one of {valid_statuses}")
    return errors


def validate_import_data(
    rows: List[Dict[str, Any]],
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Validate import data and return valid rows and errors.

    Args:
        rows: List of dictionaries with IP address data

    Returns:
        Tuple of (valid_rows, errors) where errors is a list of error dictionaries
    """
    valid_rows = []
    errors = []
    required_fields = ["address"]

    for idx, row in enumerate(rows, start=2):  # Start at 2 (row 1 is header)
        row_errors = []
        row_errors.extend(_validate_required_fields(row, required_fields))
        row_errors.extend(_validate_ip_address_field(row, valid_rows))
        row_errors.extend(_validate_subnet_field(row))
        row_errors.extend(_validate_status_field(row))

        if row_errors:
            errors.append(
                {
                    "row": idx,
                    "data": row,
                    "errors": row_errors,
                }
            )
        else:
            valid_rows.append(row)

    return valid_rows, errors


def _get_or_create_subnet(subnet_id: int) -> Tuple[Subnet, Optional[str]]:
    """Get subnet by ID, return tuple of (subnet, error)."""
    try:
        subnet = Subnet.objects.get(id=subnet_id)
        return subnet, None
    except Subnet.DoesNotExist:
        return None, f"Subnet {subnet_id} not found"


def _update_existing_ip(
    existing_ip: IPAddress,
    row: Dict[str, Any],
    results: Dict[str, Any],
) -> bool:
    """Update existing IP address. Returns True if successful."""
    subnet_id = row.get("subnet")
    status = row.get("status", "available")
    description = row.get("description", "")

    if subnet_id:
        subnet, error = _get_or_create_subnet(subnet_id)
        if error:
            results["errors"].append({"address": row["address"], "error": error})
            return False
        existing_ip.subnet = subnet

    existing_ip.status = status
    if description:
        existing_ip.description = description
    existing_ip.save()
    results["updated"] += 1
    return True


def _create_new_ip(row: Dict[str, Any], results: Dict[str, Any]) -> bool:
    """Create new IP address. Returns True if successful."""
    address = row["address"]
    subnet_id = row.get("subnet")
    status = row.get("status", "available")
    description = row.get("description", "")

    ip_address_obj = IPAddress(
        address=address,
        status=status,
        description=description or None,
    )

    if subnet_id:
        subnet, error = _get_or_create_subnet(subnet_id)
        if error:
            results["errors"].append({"address": address, "error": error})
            return False
        ip_address_obj.subnet = subnet

    ip_address_obj.save()
    results["created"] += 1
    return True


@transaction.atomic
def import_ip_addresses(
    rows: List[Dict[str, Any]],
    created_by=None,
    skip_duplicates: bool = True,
) -> Dict[str, Any]:
    """
    Import IP addresses from validated data.

    Args:
        rows: List of validated dictionaries with IP address data
        created_by: User who is importing (optional)
        skip_duplicates: If True, skip existing IPs instead of raising error

    Returns:
        Dictionary with import results:
        {
            "created": <count>,
            "updated": <count>,
            "skipped": <count>,
            "errors": <list of errors>
        }
    """
    results = {
        "created": 0,
        "updated": 0,
        "skipped": 0,
        "errors": [],
    }

    for row in rows:
        try:
            address = row["address"]
            existing_ip = IPAddress.objects.filter(address=address).first()

            if existing_ip:
                if skip_duplicates:
                    results["skipped"] += 1
                else:
                    _update_existing_ip(existing_ip, row, results)
            else:
                _create_new_ip(row, results)

        except Exception as e:
            results["errors"].append(
                {
                    "address": row.get("address", "unknown"),
                    "error": str(e),
                }
            )

    return results


def export_ip_addresses_to_csv(
    ip_addresses: List[IPAddress],
    include_headers: bool = True,
) -> str:
    """
    Export IP addresses to CSV format.

    Args:
        ip_addresses: List of IPAddress objects
        include_headers: Whether to include CSV headers

    Returns:
        CSV content as string
    """
    output = StringIO()
    fieldnames = [
        "address",
        "subnet_id",
        "subnet_network",
        "status",
        "description",
        "assigned_to_asset_id",
        "assigned_to_asset_name",
        "assigned_by_username",
        "assigned_at",
        "created_at",
        "updated_at",
    ]

    writer = csv.DictWriter(output, fieldnames=fieldnames)

    if include_headers:
        writer.writeheader()

    for ip in ip_addresses:
        writer.writerow(
            {
                "address": ip.address,
                "subnet_id": ip.subnet.id if ip.subnet else "",
                "subnet_network": ip.subnet.network if ip.subnet else "",
                "status": ip.status,
                "description": ip.description or "",
                "assigned_to_asset_id": ip.assigned_to_asset.id if ip.assigned_to_asset else "",
                "assigned_to_asset_name": ip.assigned_to_asset.name if ip.assigned_to_asset else "",
                "assigned_by_username": ip.assigned_by.username if ip.assigned_by else "",
                "assigned_at": ip.assigned_at.isoformat() if ip.assigned_at else "",
                "created_at": ip.created_at.isoformat(),
                "updated_at": ip.updated_at.isoformat(),
            }
        )

    return output.getvalue()


def export_ip_addresses_to_json(
    ip_addresses: List[IPAddress],
) -> str:
    """
    Export IP addresses to JSON format.

    Args:
        ip_addresses: List of IPAddress objects

    Returns:
        JSON content as string
    """
    data = {
        "ip_addresses": [
            {
                "address": ip.address,
                "subnet_id": ip.subnet.id if ip.subnet else None,
                "subnet_network": ip.subnet.network if ip.subnet else None,
                "status": ip.status,
                "description": ip.description,
                "assigned_to_asset_id": ip.assigned_to_asset.id if ip.assigned_to_asset else None,
                "assigned_to_asset_name": (
                    ip.assigned_to_asset.name if ip.assigned_to_asset else None
                ),
                "assigned_by_username": ip.assigned_by.username if ip.assigned_by else None,
                "assigned_at": ip.assigned_at.isoformat() if ip.assigned_at else None,
                "created_at": ip.created_at.isoformat(),
                "updated_at": ip.updated_at.isoformat(),
            }
            for ip in ip_addresses
        ],
        "count": len(ip_addresses),
    }

    return json.dumps(data, indent=2)
