# food/urls.py
from django.urls import path
from . import views

# ⚠️  ORDER MATTERS: specific action paths MUST come before <int:pk>/
# Django matches top-to-bottom, so listings/<int:pk>/ would swallow
# listings/3/delivered/ if placed first.

urlpatterns = [

    # ── Donor ────────────────────────────────────────────────────
    path('listings/',       views.DonorListingsView.as_view(),      name='donor-listings'),
    path('listings/mine/',  views.DonorListingsView.as_view(),      name='my-listings'),

    # ── NGO ──────────────────────────────────────────────────────
    path('listings/available/',  views.available_listings, name='available-listings'),
    path('listings/my-claims/',  views.ngo_claims,         name='ngo-claims'),

    # ── Delivery ─────────────────────────────────────────────────
    path('listings/pickups/',       views.available_pickups, name='available-pickups'),
    path('listings/my-deliveries/', views.my_deliveries,    name='my-deliveries'),

    # ── Action URLs — ALL before <int:pk>/ ───────────────────────
    path('listings/<int:pk>/claim/',            views.claim_listing,    name='claim-listing'),
    path('listings/<int:pk>/confirm-received/', views.confirm_received, name='confirm-received'),
    path('listings/<int:pk>/accept-pickup/',    views.accept_pickup,    name='accept-pickup'),
    path('listings/<int:pk>/picked-up/',        views.mark_picked_up,   name='picked-up'),
    path('listings/<int:pk>/delivered/',        views.mark_delivered,   name='delivered'),

    # ── Admin: all listings ──────────────────────────────────────
    path('listings/admin-all/', views.admin_all_listings, name='admin-all-listings'),

    # ── Generic detail — LAST so it never swallows action URLs ───
    path('listings/<int:pk>/',  views.DonorListingDetailView.as_view(), name='listing-detail'),
]