"""
Network Scanning Service.

Provides network discovery and host scanning capabilities.
"""

import ipaddress
import socket
import subprocess
import time
from typing import Dict, Optional, Tuple

from django.db import transaction
from django.utils import timezone

from ..models import IPAddress, NetworkScan, ScanResult, Subnet


def ping_host(ip_address: str, timeout: int = 3) -> Tuple[bool, Optional[float]]:
    """
    Ping a host to check if it's alive.

    Args:
        ip_address: IP address to ping
        timeout: Timeout in seconds

    Returns:
        Tuple of (is_alive, response_time_ms)
    """
    try:
        # Use ping command (works on Windows and Linux)
        import platform

        is_windows = platform.system().lower() == "windows"

        if is_windows:
            # Windows: -n = count, -w = timeout in milliseconds
            cmd = ["ping", "-n", "1", "-w", str(timeout * 1000), ip_address]
        else:
            # Linux/Mac: -c = count, -W = timeout in seconds
            cmd = ["ping", "-c", "1", "-W", str(timeout), ip_address]

        start_time = time.time()
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=timeout + 1,
            text=True,
        )
        end_time = time.time()

        response_time = (end_time - start_time) * 1000  # Convert to milliseconds

        # Ping is successful if return code is 0
        is_alive = result.returncode == 0

        # Log if ping fails for debugging
        if not is_alive and result.stderr:
            import logging

            logger = logging.getLogger(__name__)
            logger.debug(f"Ping failed for {ip_address}: {result.stderr[:100]}")

        return is_alive, response_time if is_alive else None

    except subprocess.TimeoutExpired:
        return False, None
    except Exception as e:
        import logging

        logger = logging.getLogger(__name__)
        logger.warning(f"Error pinging {ip_address}: {str(e)}")
        return False, None


def reverse_dns_lookup(ip_address: str) -> Optional[str]:
    """
    Perform reverse DNS lookup to get hostname.

    Args:
        ip_address: IP address to lookup

    Returns:
        Hostname or None
    """
    try:
        hostname, _, _ = socket.gethostbyaddr(ip_address)
        return hostname
    except (socket.herror, socket.gaierror, Exception):
        return None


def _parse_windows_arp(output: str, ip_address: str) -> Optional[str]:
    """Parse Windows ARP table output."""
    for line in output.split("\n"):
        if ip_address in line:
            parts = line.split()
            if len(parts) >= 2:
                mac = parts[1]
                if "-" in mac or ":" in mac:
                    return mac.upper()
    return None


def _parse_linux_arp(output: str) -> Optional[str]:
    """Parse Linux ARP table output."""
    parts = output.split()
    if len(parts) >= 3:
        mac = parts[2]
        if ":" in mac:
            return mac.upper()
    return None


def get_mac_address(ip_address: str) -> Optional[str]:
    """
    Get MAC address for an IP (requires ARP table access).

    Args:
        ip_address: IP address to lookup

    Returns:
        MAC address or None
    """
    try:
        import platform

        is_windows = platform.system().lower() == "windows"

        if is_windows:
            result = subprocess.run(
                ["arp", "-a", ip_address],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=2,
            )
            if result.returncode == 0:
                output = result.stdout.decode("utf-8", errors="ignore")
                return _parse_windows_arp(output, ip_address)
        else:
            result = subprocess.run(
                ["arp", "-n", ip_address],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=2,
            )
            if result.returncode == 0:
                output = result.stdout.decode("utf-8", errors="ignore")
                return _parse_linux_arp(output)
    except Exception:
        pass

    return None


def _create_or_update_scan(
    subnet: Subnet,
    scan_type: str,
    timeout: int,
    max_hosts: Optional[int],
    started_by,
    scan_instance: Optional[NetworkScan],
) -> NetworkScan:
    """Create or update scan instance."""
    if scan_instance:
        scan = scan_instance
        scan.status = "running"
        scan.started_at = timezone.now()
        scan.save()
    else:
        scan = NetworkScan.objects.create(
            subnet=subnet,
            scan_type=scan_type,
            status="running",
            timeout=timeout,
            max_hosts=max_hosts,
            started_by=started_by,
            started_at=timezone.now(),
        )
    return scan


def _process_alive_host(
    scan: NetworkScan,
    ip_str: str,
    response_time: Optional[float],
    scan_type: str,
    existing_ips: set,
) -> tuple[int, int]:
    """Process an alive host during scanning."""
    hosts_found = 1
    hosts_new = 0

    hostname = reverse_dns_lookup(ip_str)
    mac_address = None
    if scan_type in ["arp", "full"]:
        mac_address = get_mac_address(ip_str)

    in_ipam = ip_str in existing_ips
    ipam_status = None
    if in_ipam:
        ip_addr = IPAddress.objects.filter(address=ip_str).first()
        if ip_addr:
            ipam_status = ip_addr.status
    else:
        hosts_new = 1

    ScanResult.objects.create(
        scan=scan,
        ip_address=ip_str,
        is_active=True,
        response_time=response_time,
        mac_address=mac_address,
        hostname=hostname,
        vendor=None,
        in_ipam=in_ipam,
        ipam_status=ipam_status,
    )
    return hosts_found, hosts_new


def _process_inactive_host(scan: NetworkScan, ip_str: str, existing_ips: set) -> int:
    """Process an inactive host during scanning."""
    hosts_missing = 0
    if ip_str in existing_ips:
        hosts_missing = 1
        ScanResult.objects.create(
            scan=scan,
            ip_address=ip_str,
            is_active=False,
            in_ipam=True,
        )
    return hosts_missing


def scan_subnet(
    subnet: Subnet,
    scan_type: str = "ping",
    timeout: int = 3,
    max_hosts: Optional[int] = None,
    started_by=None,
    scan_instance: Optional[NetworkScan] = None,
) -> NetworkScan:
    """
    Scan a subnet to discover active hosts.

    Args:
        subnet: Subnet to scan
        scan_type: Type of scan (ping, arp, tcp, full)
        timeout: Timeout per host in seconds
        max_hosts: Maximum number of hosts to scan
        started_by: User who initiated the scan
        scan_instance: Optional existing NetworkScan instance to use

    Returns:
        NetworkScan instance
    """
    scan = _create_or_update_scan(
        subnet, scan_type, timeout, max_hosts, started_by, scan_instance
    )

    try:
        import logging

        logger = logging.getLogger(__name__)

        network = ipaddress.ip_network(subnet.network, strict=False)
        logger.info(f"Scanning subnet {subnet.network}, total hosts: {network.num_addresses}")

        all_ips = list(network.hosts())
        if max_hosts:
            all_ips = all_ips[:max_hosts]
            logger.info(f"Limited to {max_hosts} hosts")

        logger.info(f"Starting to scan {len(all_ips)} IP addresses")

        hosts_found = 0
        hosts_new = 0
        hosts_missing = 0

        existing_ips = set(
            IPAddress.objects.filter(subnet=subnet).values_list("address", flat=True)
        )

        for idx, ip in enumerate(all_ips):
            ip_str = str(ip)
            if idx % 10 == 0:
                logger.debug(f"Scanning IP {idx + 1}/{len(all_ips)}: {ip_str}")

            is_alive, response_time = ping_host(ip_str, timeout)

            if is_alive:
                found, new = _process_alive_host(
                    scan, ip_str, response_time, scan_type, existing_ips
                )
                hosts_found += found
                hosts_new += new
            else:
                hosts_missing += _process_inactive_host(scan, ip_str, existing_ips)

        scan.hosts_found = hosts_found
        scan.hosts_new = hosts_new
        scan.hosts_missing = hosts_missing
        scan.status = "completed"
        scan.completed_at = timezone.now()
        scan.save()

    except Exception as e:
        scan.status = "failed"
        scan.error_message = str(e)
        scan.completed_at = timezone.now()
        scan.save()

    return scan


def get_scan_summary(scan_id: int) -> Dict:
    """
    Get summary statistics for a scan.

    Args:
        scan_id: NetworkScan ID

    Returns:
        Dictionary with scan summary
    """
    scan = NetworkScan.objects.get(id=scan_id)
    results = scan.results.all()

    summary = {
        "scan_id": scan.id,
        "subnet": scan.subnet.network,
        "status": scan.status,
        "scan_type": scan.scan_type,
        "total_hosts_found": scan.hosts_found,
        "new_hosts": scan.hosts_new,
        "missing_hosts": scan.hosts_missing,
        "total_results": results.count(),
        "active_hosts": results.filter(is_active=True).count(),
        "inactive_hosts": results.filter(is_active=False).count(),
        "in_ipam": results.filter(in_ipam=True).count(),
        "not_in_ipam": results.filter(in_ipam=False).count(),
        "started_at": scan.started_at.isoformat() if scan.started_at else None,
        "completed_at": scan.completed_at.isoformat() if scan.completed_at else None,
        "duration": scan.duration,
    }

    return summary


def import_scan_results_to_ipam(
    scan_id: int,
    import_new_hosts: bool = True,
    update_existing: bool = False,
) -> Dict:
    """
    Import scan results into IPAM.

    Args:
        scan_id: NetworkScan ID
        import_new_hosts: Whether to create IP addresses for new hosts
        update_existing: Whether to update existing IP addresses

    Returns:
        Dictionary with import results
    """
    scan = NetworkScan.objects.get(id=scan_id)
    results = scan.results.filter(is_active=True, in_ipam=False)

    import_stats = {
        "created": 0,
        "updated": 0,
        "skipped": 0,
        "errors": [],
    }

    with transaction.atomic():
        for result in results:
            if not import_new_hosts:
                import_stats["skipped"] += 1
                continue

            try:
                # Check if IP already exists (might have been added manually)
                ip_addr, created = IPAddress.objects.get_or_create(
                    address=result.ip_address,
                    defaults={
                        "subnet": scan.subnet,
                        "status": "assigned",
                        "description": f"Discovered via network scan (Scan #{scan.id})",
                    },
                )

                if created:
                    import_stats["created"] += 1
                elif update_existing:
                    # Update existing IP
                    if result.hostname:
                        ip_addr.description = (
                            f"{ip_addr.description or ''}\nHostname: {result.hostname}"
                        ).strip()
                    ip_addr.save()
                    import_stats["updated"] += 1
                else:
                    import_stats["skipped"] += 1

            except Exception as e:
                import_stats["errors"].append(
                    {
                        "ip": result.ip_address,
                        "error": str(e),
                    }
                )

    return import_stats
