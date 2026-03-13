from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView,
    DonorSignupView,
    NGOSignupView,
    DeliverySignupView,
    MyStatusView,
    MeView,
    AdminUserListView,
    AdminUserDetailView,
    AdminUserApproveRejectView,
    AdminStatsView,
)

urlpatterns = [

    # ── Auth ─────────────────────────────────
    path('login/',          LoginView.as_view(),         name='login'),
    path('token/refresh/',  TokenRefreshView.as_view(),  name='token_refresh'),
    path('me/status/',      MyStatusView.as_view(),      name='my_status'),
    path('me/',             MeView.as_view(),             name='me'),

    # ── Signup ────────────────────────────────
    path('signup/donor/',    DonorSignupView.as_view(),    name='signup_donor'),
    path('signup/ngo/',      NGOSignupView.as_view(),      name='signup_ngo'),
    path('signup/delivery/', DeliverySignupView.as_view(), name='signup_delivery'),

    # ── Admin ─────────────────────────────────
    path('admin/users/',                        AdminUserListView.as_view(),          name='admin_users'),
    path('admin/users/<int:user_id>/',          AdminUserDetailView.as_view(),        name='admin_user_detail'),
    path('admin/users/<int:user_id>/action/',   AdminUserApproveRejectView.as_view(), name='admin_user_action'),
    path('admin/stats/',                        AdminStatsView.as_view(),             name='admin_stats'),
]