"""
Subnet Mask Views

API endpoints for subnet mask reference information.
"""

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.request import Request
from rest_framework.response import Response

from ..services.subnet_mask_utils import (
    get_all_subnet_masks,
    get_common_subnet_masks,
    get_subnet_mask_info,
)


@api_view(["GET"])
def subnet_masks_list(request: Request) -> Response:
    """
    Get list of subnet mask information.

    Query parameters:
    - ipv6: Set to 'true' for IPv6 masks (default: false)
    - common: Set to 'true' for only common masks (default: false)
    - min_prefix: Minimum prefix length (optional)
    - max_prefix: Maximum prefix length (optional)
    """
    is_ipv6 = request.query_params.get("ipv6", "false").lower() == "true"
    common_only = request.query_params.get("common", "false").lower() == "true"

    min_prefix = request.query_params.get("min_prefix")
    max_prefix = request.query_params.get("max_prefix")

    min_prefix = int(min_prefix) if min_prefix else None
    max_prefix = int(max_prefix) if max_prefix else None

    try:
        if common_only:
            masks = get_common_subnet_masks(is_ipv6=is_ipv6)
        else:
            masks = get_all_subnet_masks(
                is_ipv6=is_ipv6,
                min_prefix=min_prefix,
                max_prefix=max_prefix,
            )

        return Response(masks, status=status.HTTP_200_OK)
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["GET"])
def subnet_mask_detail(request: Request, prefix_length: int) -> Response:
    """
    Get detailed information for a specific subnet mask.

    Query parameters:
    - ipv6: Set to 'true' for IPv6 mask (default: false)
    """
    is_ipv6 = request.query_params.get("ipv6", "false").lower() == "true"

    try:
        prefix = int(prefix_length)
        mask_info = get_subnet_mask_info(prefix, is_ipv6=is_ipv6)
        return Response(mask_info, status=status.HTTP_200_OK)
    except ValueError as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )
