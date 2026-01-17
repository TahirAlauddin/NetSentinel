"""
Duplicate IP Address Detection Service.

Detects duplicate IP addresses across subnets and provides conflict resolution suggestions.
"""

from typing import Dict, List

from django.db.models import Count

from ..models import IPAddress, Subnet


def detect_duplicate_ips() -> List[Dict]:
    """
    Detect duplicate IP addresses across all subnets.

    Returns:
        List of dictionaries with duplicate IP information
    """
    # Find IP addresses that appear multiple times
    duplicates = IPAddress.objects.values("address").annotate(count=Count("id")).filter(count__gt=1)

    duplicate_list = []

    for dup in duplicates:
        ip_addresses = IPAddress.objects.filter(address=dup["address"]).select_related(
            "subnet", "assigned_to_asset", "assigned_by"
        )

        duplicate_info = {
            "address": dup["address"],
            "count": dup["count"],
            "instances": [],
            "conflicts": [],
        }

        for ip in ip_addresses:
            instance_info = {
                "id": ip.id,
                "subnet_id": ip.subnet.id if ip.subnet else None,
                "subnet_network": ip.subnet.network if ip.subnet else None,
                "status": ip.status,
                "assigned_to_asset_id": (ip.assigned_to_asset.id if ip.assigned_to_asset else None),
                "assigned_to_asset_name": (
                    ip.assigned_to_asset.name if ip.assigned_to_asset else None
                ),
                "description": ip.description,
                "created_at": ip.created_at.isoformat(),
                "updated_at": ip.updated_at.isoformat() if ip.updated_at else None,
            }
            duplicate_info["instances"].append(instance_info)

            # Identify conflicts (same IP in different subnets)
            if ip.subnet:
                other_ips = IPAddress.objects.filter(address=ip.address).exclude(id=ip.id)
                for other_ip in other_ips:
                    if other_ip.subnet and other_ip.subnet.id != ip.subnet.id:
                        conflict = {
                            "ip_id": other_ip.id,
                            "subnet_id": other_ip.subnet.id,
                            "subnet_network": other_ip.subnet.network,
                            "status": other_ip.status,
                        }
                        if conflict not in duplicate_info["conflicts"]:
                            duplicate_info["conflicts"].append(conflict)

        duplicate_list.append(duplicate_info)

    return duplicate_list


def detect_duplicate_subnets() -> List[Dict]:
    """
    Detect duplicate or overlapping subnets.

    Returns:
        List of dictionaries with duplicate/overlapping subnet information
    """
    import ipaddress

    subnets = Subnet.objects.all().select_related("customer", "location", "vlan", "vrf")
    subnet_list = list(subnets)
    duplicates = []

    for i, subnet1 in enumerate(subnet_list):
        try:
            network1 = ipaddress.ip_network(subnet1.network, strict=False)
        except (ValueError, AttributeError):
            continue

        overlaps = []

        for subnet2 in subnet_list[i + 1:]:
            try:
                network2 = ipaddress.ip_network(subnet2.network, strict=False)
            except (ValueError, AttributeError):
                continue

            # Check for exact duplicates
            if subnet1.network == subnet2.network and subnet1.id != subnet2.id:
                overlaps.append(
                    {
                        "type": "exact_duplicate",
                        "subnet_id": subnet2.id,
                        "subnet_network": subnet2.network,
                        "description": subnet2.description,
                    }
                )
            # Check for overlaps
            elif network1.overlaps(network2):
                overlaps.append(
                    {
                        "type": "overlap",
                        "subnet_id": subnet2.id,
                        "subnet_network": subnet2.network,
                        "description": subnet2.description,
                    }
                )

        if overlaps:
            duplicates.append(
                {
                    "subnet_id": subnet1.id,
                    "subnet_network": subnet1.network,
                    "description": subnet1.description,
                    "overlaps": overlaps,
                }
            )

    return duplicates


def get_duplicates_summary() -> Dict:
    """
    Get summary of all duplicates (IPs and subnets).

    Returns:
        Dictionary with duplicate summary
    """
    duplicate_ips = detect_duplicate_ips()
    duplicate_subnets = detect_duplicate_subnets()

    return {
        "duplicate_ips_count": len(duplicate_ips),
        "duplicate_subnets_count": len(duplicate_subnets),
        "total_duplicate_ips": sum(dup["count"] for dup in duplicate_ips),
        "duplicate_ips": duplicate_ips,
        "duplicate_subnets": duplicate_subnets,
    }


def suggest_resolution(duplicate_info: Dict) -> Dict:
    """
    Suggest resolution for duplicate IP addresses.

    Args:
        duplicate_info: Dictionary with duplicate IP information

    Returns:
        Dictionary with resolution suggestions
    """
    suggestions = {
        "address": duplicate_info["address"],
        "recommended_action": None,
        "reason": None,
        "ip_to_keep": None,
        "ips_to_remove": [],
    }

    instances = duplicate_info["instances"]

    # If all instances are in the same subnet, suggest keeping the most recent
    subnet_ids = set(inst["subnet_id"] for inst in instances if inst["subnet_id"] is not None)

    if len(subnet_ids) == 1:
        # All in same subnet - keep the most recent one
        sorted_instances = sorted(
            instances,
            key=lambda x: x["updated_at"] or x["created_at"],
            reverse=True,
        )
        suggestions["recommended_action"] = "keep_most_recent"
        suggestions["reason"] = "All instances are in the same subnet"
        suggestions["ip_to_keep"] = sorted_instances[0]["id"]
        suggestions["ips_to_remove"] = [inst["id"] for inst in sorted_instances[1:]]

    # If instances are in different subnets, suggest keeping the one with assigned asset
    elif len(subnet_ids) > 1:
        assigned_instances = [
            inst for inst in instances if inst["assigned_to_asset_id"] is not None
        ]

        if assigned_instances:
            # Keep the one with assignment
            suggestions["recommended_action"] = "keep_assigned"
            suggestions["reason"] = "Keep instance with active assignment"
            suggestions["ip_to_keep"] = assigned_instances[0]["id"]
            suggestions["ips_to_remove"] = [
                inst["id"] for inst in instances if inst["id"] != assigned_instances[0]["id"]
            ]
        else:
            # Keep the most recent one
            sorted_instances = sorted(
                instances,
                key=lambda x: x["updated_at"] or x["created_at"],
                reverse=True,
            )
            suggestions["recommended_action"] = "keep_most_recent"
            suggestions["reason"] = "No assignments found, keeping most recent"
            suggestions["ip_to_keep"] = sorted_instances[0]["id"]
            suggestions["ips_to_remove"] = [inst["id"] for inst in sorted_instances[1:]]

    return suggestions


def resolve_duplicate(
    address: str,
    ip_to_keep: int,
    ips_to_remove: List[int],
) -> Dict:
    """
    Resolve duplicate IP addresses by removing duplicates.

    Args:
        address: IP address to resolve
        ip_to_keep: ID of IP address to keep
        ips_to_remove: List of IP address IDs to remove

    Returns:
        Dictionary with resolution results
    """
    results = {
        "resolved": 0,
        "failed": 0,
        "errors": [],
    }

    # Verify the IP to keep exists
    try:
        keep_ip = IPAddress.objects.get(id=ip_to_keep, address=address)
    except IPAddress.DoesNotExist:
        results["failed"] += 1
        results["errors"].append(f"IP address {ip_to_keep} not found")
        return results

    # Remove duplicate IPs
    for ip_id in ips_to_remove:
        try:
            ip = IPAddress.objects.get(id=ip_id, address=address)
            # Don't remove if it's the one we're keeping
            if ip.id == ip_to_keep:
                continue

            # Log the removal in description before deleting
            subnet_network = ip.subnet.network if ip.subnet else "N/A"
            merge_note = f"[Merged duplicate: {ip.address} from subnet {subnet_network}]"
            if keep_ip.description:
                keep_ip.description = f"{keep_ip.description}\n{merge_note}"
            else:
                keep_ip.description = merge_note

            ip.delete()
            results["resolved"] += 1
        except IPAddress.DoesNotExist:
            results["failed"] += 1
            results["errors"].append(f"IP address {ip_id} not found")
        except Exception as e:
            results["failed"] += 1
            results["errors"].append(f"Error removing IP {ip_id}: {str(e)}")

    # Save the kept IP with updated description
    if results["resolved"] > 0:
        keep_ip.save()

    return results
