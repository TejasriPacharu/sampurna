# leaderboard/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum

User = get_user_model()

MEDALS = {1: '🏆', 2: '🥈', 3: '🥉'}


def _get_name(user):
    for attr in ['donorprofile', 'ngoprofile', 'deliveryprofile']:
        if hasattr(user, attr):
            p = getattr(user, attr)
            for field in ['org_name', 'ngo_name', 'full_name', 'name']:
                val = getattr(p, field, None)
                if val:
                    return val
    return user.email


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def donor_leaderboard(request):
    """Rank donors by total meals (quantity) in delivered listings."""
    from food.models import FoodListing

    results = (
        FoodListing.objects
        .filter(status='delivered')
        .values('donor')
        .annotate(meals=Sum('quantity'), total=Count('id'))
        .order_by('-meals')[:20]
    )

    data = []
    for i, row in enumerate(results, 1):
        try:
            user = User.objects.get(pk=row['donor'])
            data.append({
                'rank':   i,
                'badge':  MEDALS.get(i, ''),
                'name':   _get_name(user),
                'email':  user.email,
                'meals':  row['meals'] or 0,
                'total':  row['total'],
            })
        except User.DoesNotExist:
            continue

    return Response(data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def delivery_leaderboard(request):
    """Rank delivery partners by number of completed deliveries."""
    from food.models import FoodListing

    results = (
        FoodListing.objects
        .filter(status='delivered', delivery_guy__isnull=False)
        .values('delivery_guy')
        .annotate(deliveries=Count('id'), meals=Sum('quantity'))
        .order_by('-deliveries')[:20]
    )

    data = []
    for i, row in enumerate(results, 1):
        try:
            user = User.objects.get(pk=row['delivery_guy'])
            data.append({
                'rank':       i,
                'badge':      MEDALS.get(i, ''),
                'name':       _get_name(user),
                'email':      user.email,
                'deliveries': row['deliveries'] or 0,
                'meals':      row['meals'] or 0,
            })
        except User.DoesNotExist:
            continue

    return Response(data)