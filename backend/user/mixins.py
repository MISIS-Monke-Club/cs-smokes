from rest_framework import permissions


class IsOwnerMixin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user


class IsAdminOrCreator(permissions.BasePermission):

    def has_permission(self, request, view):
        if request.method == "POST":
            return request.user.is_authenticated
        return True

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        if request.method == "DELETE":
            is_creator = obj.creator == request.user
            is_admin = getattr(request.user, "is_superuser", False) or getattr(
                getattr(request.user, "admin_type", None), "is_superuser", False
            )
            return is_creator or is_admin

        if request.method in ["PATCH", "PUT"]:
            return getattr(request.user, "is_superuser", False) or getattr(
                getattr(request.user, "admin_type", None), "is_superuser", False
            )

        return False


def is_admin(user):
    if getattr(user, "is_superuser", False):
        return True


class AdminOnlyForUpdate(permissions.BasePermission):

    def has_object_permission(self, request, view, obj):
        if request.method in ["PATCH", "PUT"]:
            return is_admin(request.user)
        return True
