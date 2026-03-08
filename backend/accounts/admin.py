from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, DonorProfile, NGOProfile, DeliveryProfile


class DonorProfileInline(admin.StackedInline):
    model = DonorProfile
    can_delete = False
    verbose_name_plural = 'Donor Profile'


class NGOProfileInline(admin.StackedInline):
    model = NGOProfile
    can_delete = False
    verbose_name_plural = 'NGO Profile'


class DeliveryProfileInline(admin.StackedInline):
    model = DeliveryProfile
    can_delete = False
    verbose_name_plural = 'Delivery Profile'


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ['email', 'role', 'status', 'phone', 'created_at']
    list_filter   = ['role', 'status']
    search_fields = ['email', 'phone']
    ordering      = ['-created_at']

    fieldsets = (
        (None,           {'fields': ('email', 'password')}),
        ('Role & Status',{'fields': ('role', 'status', 'phone')}),
        ('Permissions',  {'fields': ('is_active', 'is_staff', 'is_superuser')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'phone', 'role', 'password1', 'password2'),
        }),
    )

    def get_inlines(self, request, obj=None):
        if obj:
            if obj.role == 'donor':
                return [DonorProfileInline]
            elif obj.role == 'ngo':
                return [NGOProfileInline]
            elif obj.role == 'delivery':
                return [DeliveryProfileInline]
        return []


@admin.register(DonorProfile)
class DonorProfileAdmin(admin.ModelAdmin):
    list_display = ['org_name', 'responsible_person', 'user']


@admin.register(NGOProfile)
class NGOProfileAdmin(admin.ModelAdmin):
    list_display = ['ngo_name', 'volunteer_name', 'user']


@admin.register(DeliveryProfile)
class DeliveryProfileAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'user', 'platform_id']