# food/serializers.py
from rest_framework import serializers
from .models import FoodListing


def _profile(user):
    """Get the role-specific profile attached to a user.
    Uses the actual related_names defined in accounts/models.py:
      donor_profile, ngo_profile, delivery_profile
    """
    if not user:
        return None
    for attr in ('ngo_profile', 'donor_profile', 'delivery_profile'):
        if hasattr(user, attr):
            try:
                return getattr(user, attr)
            except Exception:
                pass
    return None


def _get(obj, *attrs, default=''):
    """Try multiple attribute names, return first non-empty value."""
    for attr in attrs:
        val = getattr(obj, attr, None)
        if val:
            return str(val)
    return default


class FoodListingSerializer(serializers.ModelSerializer):
    # Donor
    donor_name         = serializers.SerializerMethodField()
    donor_email        = serializers.SerializerMethodField()
    donor_phone        = serializers.SerializerMethodField()
    donor_location     = serializers.SerializerMethodField()

    # NGO (claimed_by)
    claimed_by_name    = serializers.SerializerMethodField()
    claimed_by_email   = serializers.SerializerMethodField()
    ngo_location       = serializers.SerializerMethodField()
    ngo_phone          = serializers.SerializerMethodField()

    # Delivery
    delivery_name      = serializers.SerializerMethodField()
    delivery_email     = serializers.SerializerMethodField()
    delivery_phone     = serializers.SerializerMethodField()

    class Meta:
        model  = FoodListing
        fields = [
            'id', 'food_type', 'quantity', 'unit',
            'prepared_time', 'expiry_time',
            'location',
            'pickup_available', 'delivery_mode', 'notes', 'photo',
            'status', 'created_at', 'updated_at',
            # donor
            'donor_name', 'donor_email', 'donor_phone', 'donor_location',
            # ngo
            'claimed_by_name', 'claimed_by_email', 'ngo_location', 'ngo_phone',
            # delivery
            'delivery_name', 'delivery_email', 'delivery_phone',
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']

    # ── Donor ───────────────────────────────────────────────────
    def get_donor_name(self, obj):
        p = _profile(obj.donor)
        if p:
            return _get(p, 'org_name', 'responsible_person', 'full_name', 'name')
        return obj.donor.email if obj.donor else ''

    def get_donor_email(self, obj):
        return obj.donor.email if obj.donor else ''

    def get_donor_phone(self, obj):
        # phone lives on User model directly
        return getattr(obj.donor, 'phone', '') or ''

    def get_donor_location(self, obj):
        if obj.location:
            return obj.location
        p = _profile(obj.donor)
        return _get(p, 'location', 'address') if p else ''

    # ── NGO ─────────────────────────────────────────────────────
    def get_claimed_by_name(self, obj):
        if not obj.claimed_by:
            return None
        p = _profile(obj.claimed_by)
        if p:
            return _get(p, 'ngo_name', 'org_name', 'volunteer_name', 'full_name', 'name')
        return obj.claimed_by.email

    def get_claimed_by_email(self, obj):
        return obj.claimed_by.email if obj.claimed_by else None

    def get_ngo_location(self, obj):
        """NGO drop address from ngo_profile.location (set at signup)."""
        if not obj.claimed_by:
            return None
        p = _profile(obj.claimed_by)
        if p:
            return _get(p, 'location', 'address', 'ngo_address') or None
        return None

    def get_ngo_phone(self, obj):
        if not obj.claimed_by:
            return None
        # phone is on the User model, not the profile
        return getattr(obj.claimed_by, 'phone', '') or ''

    # ── Delivery ─────────────────────────────────────────────────
    def get_delivery_name(self, obj):
        if not obj.delivery_guy:
            return None
        p = _profile(obj.delivery_guy)
        if p:
            return _get(p, 'full_name', 'name')
        return obj.delivery_guy.email

    def get_delivery_email(self, obj):
        return obj.delivery_guy.email if obj.delivery_guy else None

    def get_delivery_phone(self, obj):
        if not obj.delivery_guy:
            return None
        # phone is on the User model, not the profile
        return getattr(obj.delivery_guy, 'phone', '') or ''