# leaderboard/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('donors/',   views.donor_leaderboard,   name='donor-leaderboard'),
    path('delivery/', views.delivery_leaderboard, name='delivery-leaderboard'),
]