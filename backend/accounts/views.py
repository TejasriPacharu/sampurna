from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User
from .serializers import (
    DonorSignupSerializer,
    NGOSignupSerializer,
    DeliverySignupSerializer,
    AdminUserListSerializer,
    UserStatusUpdateSerializer,
    CustomTokenObtainPairSerializer,
)
from .permissions import IsAdminUser, IsApprovedUser


# ─────────────────────────────────────────────
# Auth: Custom JWT Login (injects role + status)
# ─────────────────────────────────────────────
class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


# ─────────────────────────────────────────────
# Auth: Signup — Donor
# ─────────────────────────────────────────────
class DonorSignupView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = DonorSignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {
                    "message": "Donor signup successful. Awaiting admin approval.",
                    "email": user.email,
                    "role": user.role,
                    "status": user.status,
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────
# Auth: Signup — NGO
# ─────────────────────────────────────────────
class NGOSignupView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = NGOSignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {
                    "message": "NGO signup successful. Awaiting admin approval.",
                    "email": user.email,
                    "role": user.role,
                    "status": user.status,
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────
# Auth: Signup — Delivery Partner
# ─────────────────────────────────────────────
class DeliverySignupView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = DeliverySignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {
                    "message": "Delivery partner signup successful. Awaiting admin approval.",
                    "email": user.email,
                    "role": user.role,
                    "status": user.status,
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────
# Auth: Check own status (for app to poll)
# ─────────────────────────────────────────────
class MyStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "status": user.status,
        })


# ─────────────────────────────────────────────
# Admin: View all pending/approved/rejected users
# ─────────────────────────────────────────────
class AdminUserListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        filter_status = request.query_params.get('status', None)
        filter_role   = request.query_params.get('role', None)

        users = User.objects.exclude(role='admin')

        if filter_status:
            users = users.filter(status=filter_status)
        if filter_role:
            users = users.filter(role=filter_role)

        serializer = AdminUserListSerializer(users, many=True, context={'request': request})
        return Response({
            "count": users.count(),
            "results": serializer.data
        })


# ─────────────────────────────────────────────
# Admin: View single user detail
# ─────────────────────────────────────────────
class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminUserListSerializer(user, context={'request': request})
        return Response(serializer.data)


# ─────────────────────────────────────────────
# Admin: Approve or Reject a user
# ─────────────────────────────────────────────
class AdminUserApproveRejectView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def patch(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = UserStatusUpdateSerializer(data=request.data)
        if serializer.is_valid():
            new_status = serializer.validated_data['status']
            user.status = new_status
            user.save(update_fields=['status', 'updated_at'])

            return Response({
                "message": f"User {user.email} has been {new_status}.",
                "user_id": user.id,
                "role": user.role,
                "status": user.status,
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─────────────────────────────────────────────
# Admin: Stats summary (pending counts per role)
# ─────────────────────────────────────────────
class AdminStatsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        roles = ['donor', 'ngo', 'delivery']
        stats = {}
        for role in roles:
            stats[role] = {
                'pending':  User.objects.filter(role=role, status='pending').count(),
                'approved': User.objects.filter(role=role, status='approved').count(),
                'rejected': User.objects.filter(role=role, status='rejected').count(),
            }
        stats['total_pending'] = User.objects.filter(status='pending').count()
        return Response(stats)


# ─────────────────────────────────────────────
# Auth: Get / Update own full profile
# Returns name, phone, location for all roles
# ─────────────────────────────────────────────
class MeView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        user = request.user
        data = {
            'user_id': user.id,
            'email':   user.email,
            'phone':   user.phone,
            'role':    user.role,
            'status':  user.status,
        }

        if user.role == 'donor' and hasattr(user, 'donor_profile'):
            p = user.donor_profile
            data.update({
                'name':               p.org_name,
                'org_name':           p.org_name,
                'responsible_person': p.responsible_person,
                'location':           p.location,
                'address':            p.location,   # alias so frontend works with either key
                'latitude':           p.latitude,
                'longitude':          p.longitude,
            })

        elif user.role == 'ngo' and hasattr(user, 'ngo_profile'):
            p = user.ngo_profile
            data.update({
                'name':           p.ngo_name,
                'ngo_name':       p.ngo_name,
                'volunteer_name': p.volunteer_name,
                'location':       p.location,
                'address':        p.location,
                'latitude':       p.latitude,
                'longitude':      p.longitude,
            })

        elif user.role == 'delivery' and hasattr(user, 'delivery_profile'):
            p = user.delivery_profile
            data.update({
                'name':        p.full_name,
                'full_name':   p.full_name,
                'location':    p.address,
                'address':     p.address,
                'latitude':    p.latitude,
                'longitude':   p.longitude,
                'platform_id': p.platform_id,
            })

        return Response(data)

    def patch(self, request):
        user = request.user

        # Update phone on User model if provided
        if 'phone' in request.data:
            user.phone = request.data['phone']
            user.save(update_fields=['phone', 'updated_at'])

        # Update role-specific profile fields
        if user.role == 'donor' and hasattr(user, 'donor_profile'):
            p = user.donor_profile
            for field in ['org_name', 'responsible_person', 'location']:
                if field in request.data:
                    setattr(p, field, request.data[field])
            for coord in ['latitude', 'longitude']:
                if coord in request.data:
                    setattr(p, coord, request.data[coord] or None)
            p.save()

        elif user.role == 'ngo' and hasattr(user, 'ngo_profile'):
            p = user.ngo_profile
            for field in ['ngo_name', 'volunteer_name', 'location']:
                if field in request.data:
                    setattr(p, field, request.data[field])
            for coord in ['latitude', 'longitude']:
                if coord in request.data:
                    setattr(p, coord, request.data[coord] or None)
            p.save()

        elif user.role == 'delivery' and hasattr(user, 'delivery_profile'):
            p = user.delivery_profile
            for field in ['full_name', 'address', 'platform_id']:
                if field in request.data:
                    setattr(p, field, request.data[field])
            for coord in ['latitude', 'longitude']:
                if coord in request.data:
                    setattr(p, coord, request.data[coord] or None)
            p.save()

        return Response({'detail': 'Profile updated successfully.'})