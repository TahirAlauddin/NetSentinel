from rest_framework.permissions import BasePermission


class CanExecuteRemediation(BasePermission):
    """
    Gates the RemediationAction "approve" action. Nobody has this by default — an
    admin must assign the execute_remediation PermissionBundle to a group.
    """

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.has_perm("remediation.execute_remediationaction")
        )
