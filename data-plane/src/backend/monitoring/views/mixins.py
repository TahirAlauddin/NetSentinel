from functools import wraps

from rest_framework import status
from rest_framework.response import Response

from lib.zabbix.exceptions import ZabbixAPIError, ZabbixConnectionError

from ..zabbix_client import ZabbixNotConfiguredError, get_zabbix_client


class ZabbixViewMixin:
    """Base helpers for monitoring views backed by Zabbix."""

    def get_zabbix(self):
        return get_zabbix_client()

    def handle_zabbix_errors(self, func):
        try:
            return func()
        except ZabbixNotConfiguredError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except ZabbixConnectionError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        except ZabbixAPIError as exc:
            return Response(
                {"detail": str(exc), "code": exc.code, "data": exc.data},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def zabbix_response(self, func):
        result = self.handle_zabbix_errors(func)
        if isinstance(result, Response):
            return result
        return Response(result)


def zabbix_action(method):
    @wraps(method)
    def wrapper(self, request, *args, **kwargs):
        return self.zabbix_response(lambda: method(self, request, *args, **kwargs))

    return wrapper
