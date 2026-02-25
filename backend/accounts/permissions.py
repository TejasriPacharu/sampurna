from rest_framework.permissions import BasePermission


class IsApprovedUser(BasePermission):
    """
    Allows access only to users whose status is 'approved'.
    Returns a helpful message for pending/rejected users.
    """
    message = "Your account is pending admin approval."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.status == 'rejected':
            self.message = "Your account request has been rejected. Please contact support."
            return False
        if request.user.status == 'pending':
            self.message = "Your account is pending admin approval. You will be notified once approved."
            return False
        return request.user.status == 'approved'


class IsAdminUser(BasePermission):
    """Allows access only to admin role users."""
    message = "Admin access required."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'admin'
        )


class IsDonor(BasePermission):
    """Allows access only to approved donors."""
    message = "This endpoint is for donors only."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'donor'
            and request.user.status == 'approved'
        )


class IsNGO(BasePermission):
    """Allows access only to approved NGOs."""
    message = "This endpoint is for NGOs only."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'ngo'
            and request.user.status == 'approved'
        )


class IsDeliveryPartner(BasePermission):
    """Allows access only to approved delivery partners."""
    message = "This endpoint is for delivery partners only."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'delivery'
            and request.user.status == 'approved'
        )