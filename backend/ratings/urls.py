# ratings/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Using explicit 'submit/' so Django never gets confused by trailing-slash redirect
    path('submit/', views.ratings_view, name='ratings'),
    path('',        views.ratings_view, name='ratings-root'),   # keep for backwards compat
    path('mine/',   views.my_ratings,   name='my-ratings'),
]