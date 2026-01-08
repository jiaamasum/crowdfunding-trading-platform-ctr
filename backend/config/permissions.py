from rest_framework import permissions


class IsAdminRole(permissions.BasePermission):
    """Allow access only to users with ADMIN role."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (
                getattr(user, 'role', None) == 'ADMIN'
                or getattr(user, 'is_staff', False)
                or getattr(user, 'is_superuser', False)
            )
        )
