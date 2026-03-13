# food/views.py

from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from .models import FoodListing
from .serializers import FoodListingSerializer


def get_user_role(user):
    """Return role string: donor | ngo | delivery | admin"""
    for attr in ['donorprofile', 'ngoprofile', 'deliveryprofile']:
        if hasattr(user, attr):
            return attr.replace('profile', '')
    return getattr(user, 'role', 'unknown')


# ── Donor: create + list own listings ───────────────────────────
class DonorListingsView(generics.ListCreateAPIView):
    serializer_class   = FoodListingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = FoodListing.objects.filter(donor=self.request.user)
        status_f = self.request.query_params.get('status')
        if status_f:
            qs = qs.filter(status=status_f)
        return qs

    def perform_create(self, serializer):
        serializer.save(donor=self.request.user)


# ── Donor: update / delete own listing ──────────────────────────
class DonorListingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = FoodListingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FoodListing.objects.filter(donor=self.request.user)

    def destroy(self, request, *args, **kwargs):
        listing = self.get_object()
        if listing.status != 'active':
            return Response({'detail': 'Only active listings can be deleted.'}, status=400)
        listing.delete()
        return Response(status=204)


# ── NGO: browse active listings ─────────────────────────────────
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def available_listings(request):
    # Mark expired listings first
    FoodListing.objects.filter(
        status='active', expiry_time__lt=timezone.now()
    ).update(status='expired')

    qs = FoodListing.objects.filter(status='active').select_related('donor', 'claimed_by', 'delivery_guy')

    # Optional filters
    pickup = request.query_params.get('pickup_available')
    if pickup in ('true', 'True', '1'):
        qs = qs.filter(pickup_available=True)
    elif pickup in ('false', 'False', '0'):
        qs = qs.filter(pickup_available=False)

    food_type = request.query_params.get('food_type')
    if food_type:
        qs = qs.filter(food_type__icontains=food_type)

    delivery_mode = request.query_params.get('delivery_mode')
    if delivery_mode:
        qs = qs.filter(delivery_mode=delivery_mode)

    serializer = FoodListingSerializer(qs, many=True)
    return Response({'results': serializer.data})


# ── NGO: claim a listing ─────────────────────────────────────────
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def claim_listing(request, pk):
    try:
        listing = FoodListing.objects.get(pk=pk, status='active')
    except FoodListing.DoesNotExist:
        return Response({'detail': 'Listing not available.'}, status=404)

    listing.claimed_by = request.user
    listing.status     = 'claimed'
    listing.save()
    return Response(FoodListingSerializer(listing).data)


# ── NGO: list own claims ─────────────────────────────────────────
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def ngo_claims(request):
    qs = (
        FoodListing.objects
        .filter(claimed_by=request.user)
        .select_related('donor', 'claimed_by', 'delivery_guy')   # avoids N+1 queries
    )
    status_f = request.query_params.get('status')
    if status_f:
        qs = qs.filter(status=status_f)
    serializer = FoodListingSerializer(qs, many=True)
    return Response({'results': serializer.data})


# ── NGO: confirm received (for self-delivery mode) ────────────────
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def confirm_received(request, pk):
    try:
        listing = FoodListing.objects.get(pk=pk, claimed_by=request.user)
    except FoodListing.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=404)

    if listing.status not in ('claimed', 'picked_up'):
        return Response({'detail': 'Invalid status transition.'}, status=400)

    listing.status = 'delivered'
    listing.save()
    return Response(FoodListingSerializer(listing).data)


# ── Delivery: browse available pickups ────────────────────────────
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def available_pickups(request):
    """Claimed listings that don't have a delivery guy yet (platform mode only)."""
    qs = FoodListing.objects.filter(
        status='claimed',
        delivery_guy__isnull=True,
        delivery_mode='platform',
    )
    serializer = FoodListingSerializer(qs, many=True)
    return Response({'results': serializer.data})


# ── Delivery: accept a pickup ─────────────────────────────────────
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def accept_pickup(request, pk):
    try:
        listing = FoodListing.objects.get(pk=pk, status='claimed', delivery_guy__isnull=True)
    except FoodListing.DoesNotExist:
        return Response({'detail': 'Pickup not available.'}, status=404)

    listing.delivery_guy = request.user
    listing.save()
    return Response(FoodListingSerializer(listing).data)


# ── Delivery: mark picked up ──────────────────────────────────────
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_picked_up(request, pk):
    try:
        listing = FoodListing.objects.get(pk=pk, delivery_guy=request.user, status='claimed')
    except FoodListing.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=404)

    listing.status = 'picked_up'
    listing.save()
    return Response(FoodListingSerializer(listing).data)


# ── Delivery: mark delivered ──────────────────────────────────────
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_delivered(request, pk):
    try:
        # Accept from both 'picked_up' and 'claimed' in case picked-up step was skipped
        listing = FoodListing.objects.get(
            pk=pk,
            delivery_guy=request.user,
            status__in=['picked_up', 'claimed'],
        )
    except FoodListing.DoesNotExist:
        return Response({'detail': 'Listing not found or not assigned to you.'}, status=404)

    listing.status = 'delivered'
    listing.save()
    return Response(FoodListingSerializer(listing).data)


# ── Delivery: my deliveries ───────────────────────────────────────
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_deliveries(request):
    status_f = request.query_params.get('status', '')
    qs = FoodListing.objects.filter(delivery_guy=request.user)

    if status_f == 'active':
        qs = qs.filter(status__in=['claimed', 'picked_up'])
    elif status_f == 'delivered':
        qs = qs.filter(status='delivered')

    serializer = FoodListingSerializer(qs, many=True)
    return Response({'results': serializer.data})


# ── Admin: ALL listings across all statuses ───────────────────────
# Called by AdminDashboard to get the full picture.
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_all_listings(request):
    """Return every listing for admin users. Non-admins get their own listings."""
    user = request.user

    # Admin sees everything; other roles see only their own
    if getattr(user, 'role', None) == 'admin' or user.is_staff:
        qs = FoodListing.objects.select_related('donor', 'claimed_by', 'delivery_guy').all()
    else:
        # Fallback: return role-appropriate listings so the endpoint is reusable
        qs = FoodListing.objects.filter(donor=user).select_related('donor', 'claimed_by', 'delivery_guy')

    # Optional status filter
    status_f = request.query_params.get('status')
    if status_f:
        qs = qs.filter(status=status_f)

    # Auto-expire overdue active listings
    FoodListing.objects.filter(status='active', expiry_time__lt=timezone.now()).update(status='expired')

    serializer = FoodListingSerializer(qs.order_by('-updated_at'), many=True)
    return Response({'results': serializer.data, 'count': qs.count()})