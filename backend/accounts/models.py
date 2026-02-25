from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


# ─────────────────────────────────────────────
# Custom User Manager
# ─────────────────────────────────────────────
class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('status', 'approved')
        return self.create_user(email, password, **extra_fields)


# ─────────────────────────────────────────────
# Core User Model
# ─────────────────────────────────────────────
class User(AbstractBaseUser, PermissionsMixin):

    ROLE_CHOICES = [
        ('donor', 'Donor'),
        ('ngo', 'NGO'),
        ('delivery', 'Delivery Partner'),
        ('admin', 'Admin'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    email       = models.EmailField(unique=True)
    phone       = models.CharField(max_length=15)
    role        = models.CharField(max_length=20, choices=ROLE_CHOICES)
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_active   = models.BooleanField(default=True)
    is_staff    = models.BooleanField(default=False)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['phone', 'role']
    objects = UserManager()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.email} [{self.role}] — {self.status}"

    @property
    def is_approved(self):
        return self.status == 'approved'


# ─────────────────────────────────────────────
# Donor Profile
# ─────────────────────────────────────────────
class DonorProfile(models.Model):
    user               = models.OneToOneField(User, on_delete=models.CASCADE, related_name='donor_profile')
    org_name           = models.CharField(max_length=255)
    responsible_person = models.CharField(max_length=255)
    location           = models.TextField()
    latitude           = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude          = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    fssai_proof        = models.FileField(upload_to='proofs/donor/')
    created_at         = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.org_name} (Donor)"


# ─────────────────────────────────────────────
# NGO Profile
# ─────────────────────────────────────────────
class NGOProfile(models.Model):
    user           = models.OneToOneField(User, on_delete=models.CASCADE, related_name='ngo_profile')
    ngo_name       = models.CharField(max_length=255)
    volunteer_name = models.CharField(max_length=255)
    location       = models.TextField()
    latitude       = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude      = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    ngo_proof      = models.FileField(upload_to='proofs/ngo/')
    created_at     = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.ngo_name} (NGO)"


# ─────────────────────────────────────────────
# Delivery Partner Profile
# ─────────────────────────────────────────────
class DeliveryProfile(models.Model):
    user            = models.OneToOneField(User, on_delete=models.CASCADE, related_name='delivery_profile')
    full_name       = models.CharField(max_length=255)
    address         = models.TextField()
    latitude        = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude       = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    license_upload  = models.FileField(upload_to='proofs/delivery/')
    platform_id     = models.CharField(max_length=100, blank=True, null=True)
    created_at      = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} (Delivery)"