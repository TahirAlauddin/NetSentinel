from rest_framework.permissions import DjangoModelPermissions


class StrictDjangoModelPermissions(DjangoModelPermissions):
    """
    Extends DjangoModelPermissions to enforce view_ permissions on GET/HEAD/OPTIONS.

    DRF's default DjangoModelPermissions maps safe methods (GET, HEAD, OPTIONS) to an
    empty permission list, meaning any authenticated user can read. This subclass requires
    the appropriate view_ permission for read access, enforcing proper RBAC isolation.
    """

    perms_map = {
        **DjangoModelPermissions.perms_map,
        "GET": ["%(app_label)s.view_%(model_name)s"],
        "HEAD": ["%(app_label)s.view_%(model_name)s"],
        "OPTIONS": ["%(app_label)s.view_%(model_name)s"],
    }
