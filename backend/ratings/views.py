# ratings/views.py
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import Rating
from .serializers import RatingSerializer

User = get_user_model()


def _find_user(value):
    """Find user by PK (int) or email (str)."""
    if not value:
        return None
    try:
        # Try as integer PK first
        return User.objects.get(pk=int(value))
    except (ValueError, TypeError):
        pass
    try:
        # Fall back to email lookup
        return User.objects.get(email=value)
    except User.DoesNotExist:
        return None


@api_view(['POST', 'GET'])
@permission_classes([permissions.IsAuthenticated])
def ratings_view(request):
    if request.method == 'GET':
        rated_user_id = request.query_params.get('rated_user')
        if rated_user_id:
            user = _find_user(rated_user_id)
            qs = Rating.objects.filter(rated_user=user) if user else Rating.objects.none()
        else:
            qs = Rating.objects.all()
        return Response({'results': RatingSerializer(qs, many=True).data})

    # POST — submit a rating
    rated_user = _find_user(request.data.get('rated_user_id'))
    if not rated_user:
        return Response({'detail': 'User not found.'}, status=404)

    try:
        rating_val = int(request.data.get('rating', 5))
    except (ValueError, TypeError):
        rating_val = 5

    rating_val = max(1, min(5, rating_val))  # clamp to 1–5

    listing_id = request.data.get('listing_id') or None

    rating, created = Rating.objects.update_or_create(
        reviewer=request.user,
        listing_id=listing_id,
        defaults={
            'rated_user': rated_user,
            'rating':     rating_val,
            'comment':    request.data.get('comment', ''),
        }
    )

    return Response(
        RatingSerializer(rating).data,
        status=201 if created else 200
    )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_ratings(request):
    qs = Rating.objects.filter(rated_user=request.user)
    return Response({'results': RatingSerializer(qs, many=True).data})