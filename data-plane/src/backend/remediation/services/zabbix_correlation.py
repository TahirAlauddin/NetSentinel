"""
Best-effort matching of a Zabbix host to a NetSentinel asset/device.

Used only by the sync_zabbix_host_links management command to (re)populate
ZabbixHostLink rows. The agent loop itself never calls this live — it reads the
cached ZabbixHostLink row instead (see remediation/models.py:ZabbixHostLink).
"""

from __future__ import annotations

from typing import Optional, TypedDict

from assets.models import Asset
from assets.models.network import NetworkDetails
from ipam.models.device import Device


class HostMatch(TypedDict):
    asset: Optional[Asset]
    device: Optional[Device]


def match_host_to_asset(hostname: str, ip_address: Optional[str]) -> HostMatch:
    """
    Try to resolve a Zabbix host to a NetSentinel Device and/or Asset.

    Order: IP match against ipam.Device, then IP match against assets.NetworkDetails,
    then hostname substring match against Device.name / Asset.name. Returns whatever
    is found (both, one, or neither) — there is no guaranteed link, only a best guess.
    """
    device: Optional[Device] = None
    asset: Optional[Asset] = None

    if ip_address:
        device = Device.objects.filter(ip_address=ip_address).first()
        network_details = (
            NetworkDetails.objects.filter(ip_address=ip_address).select_related("asset").first()
        )
        if network_details:
            asset = network_details.asset

    if not device and not asset and hostname:
        device = Device.objects.filter(name__icontains=hostname).first()
        if not device:
            asset = Asset.objects.filter(name__icontains=hostname).first()

    return {"asset": asset, "device": device}
