# ratings/models.py
from django.db import models
from django.conf import settings


class Rating(models.Model):
    reviewer   = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='given_ratings')
    rated_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_ratings')
    listing    = models.ForeignKey('food.FoodListing', on_delete=models.CASCADE, null=True, blank=True)
    rating     = models.PositiveSmallIntegerField()   # 1-5
    comment    = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('reviewer', 'listing')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.reviewer} → {self.rated_user}: {self.rating}★"