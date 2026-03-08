from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db import transaction
from .models import User, DonorProfile, NGOProfile, DeliveryProfile


# ─────────────────────────────────────────────
# JWT: Inject role + status into token payload
# ─────────────────────────────────────────────
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['status'] = user.status
        token['email'] = user.email
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data['role'] = self.user.role
        data['status'] = self.user.status
        data['email'] = self.user.email
        data['user_id'] = self.user.id
        return data


# ─────────────────────────────────────────────
# Profile Serializers (nested)
# ─────────────────────────────────────────────
class DonorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonorProfile
        exclude = ['user']


class NGOProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = NGOProfile
        exclude = ['user']


class DeliveryProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryProfile
        exclude = ['user']


# ─────────────────────────────────────────────
# Donor Signup
# ─────────────────────────────────────────────
class DonorSignupSerializer(serializers.Serializer):
    # User fields
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    phone    = serializers.CharField(max_length=15)

    # Donor-specific fields
    org_name           = serializers.CharField(max_length=255)
    responsible_person = serializers.CharField(max_length=255)
    location           = serializers.CharField()
    latitude           = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude          = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    fssai_proof        = serializers.FileField()

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            phone=validated_data['phone'],
            role='donor',
            status='pending',
        )
        DonorProfile.objects.create(
            user=user,
            org_name=validated_data['org_name'],
            responsible_person=validated_data['responsible_person'],
            location=validated_data['location'],
            latitude=validated_data.get('latitude'),
            longitude=validated_data.get('longitude'),
            fssai_proof=validated_data['fssai_proof'],
        )
        return user


# ─────────────────────────────────────────────
# NGO Signup
# ─────────────────────────────────────────────
class NGOSignupSerializer(serializers.Serializer):
    # User fields
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    phone    = serializers.CharField(max_length=15)

    # NGO-specific fields
    ngo_name       = serializers.CharField(max_length=255)
    volunteer_name = serializers.CharField(max_length=255)
    location       = serializers.CharField()
    latitude       = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude      = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    ngo_proof      = serializers.FileField()

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            phone=validated_data['phone'],
            role='ngo',
            status='pending',
        )
        NGOProfile.objects.create(
            user=user,
            ngo_name=validated_data['ngo_name'],
            volunteer_name=validated_data['volunteer_name'],
            location=validated_data['location'],
            latitude=validated_data.get('latitude'),
            longitude=validated_data.get('longitude'),
            ngo_proof=validated_data['ngo_proof'],
        )
        return user


# ─────────────────────────────────────────────
# Delivery Partner Signup
# ─────────────────────────────────────────────
class DeliverySignupSerializer(serializers.Serializer):
    # User fields
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    phone    = serializers.CharField(max_length=15)

    # Delivery-specific fields
    full_name      = serializers.CharField(max_length=255)
    address        = serializers.CharField()
    license_upload = serializers.FileField()
    platform_id    = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    @transaction.atomic
    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            phone=validated_data['phone'],
            role='delivery',
            status='pending',
        )
        DeliveryProfile.objects.create(
            user=user,
            full_name=validated_data['full_name'],
            address=validated_data['address'],
            license_upload=validated_data['license_upload'],
            platform_id=validated_data.get('platform_id'),
        )
        return user


# ─────────────────────────────────────────────
# Admin: User list view serializer
# ─────────────────────────────────────────────
class AdminUserListSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'phone', 'role', 'status', 'created_at', 'profile']

    def get_profile(self, obj):
        if obj.role == 'donor' and hasattr(obj, 'donor_profile'):
            return DonorProfileSerializer(obj.donor_profile).data
        elif obj.role == 'ngo' and hasattr(obj, 'ngo_profile'):
            return NGOProfileSerializer(obj.ngo_profile).data
        elif obj.role == 'delivery' and hasattr(obj, 'delivery_profile'):
            return DeliveryProfileSerializer(obj.delivery_profile).data
        return None


# ─────────────────────────────────────────────
# Admin: Approve/Reject action serializer
# ─────────────────────────────────────────────
class UserStatusUpdateSerializer(serializers.Serializer):
    STATUS_OPTIONS = [('approved', 'Approved'), ('rejected', 'Rejected')]
    status          = serializers.ChoiceField(choices=STATUS_OPTIONS)
    rejection_reason = serializers.CharField(required=False, allow_blank=True)