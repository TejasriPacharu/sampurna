# food/models.py

from django.db import models
from django.conf import settings


class FoodListing(models.Model):
    STATUS_CHOICES = [
        ('active',    'Active'),
        ('claimed',   'Claimed'),
        ('picked_up', 'Picked Up'),
        ('delivered', 'Delivered'),
        ('expired',   'Expired'),
    ]
    DELIVERY_MODE_CHOICES = [
        ('platform', 'Platform'),
        ('self',     'Self Delivery'),
    ]
    UNIT_CHOICES = [
        ('portions', 'Portions'),
        ('kg',       'kg'),
        ('litres',   'Litres'),
        ('packets',  'Packets'),
        ('boxes',    'Boxes'),
    ]

    # Core fields
    donor          = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='listings')
    food_type      = models.CharField(max_length=200)
    quantity       = models.PositiveIntegerField()
    unit           = models.CharField(max_length=20, choices=UNIT_CHOICES, default='portions')
    prepared_time  = models.DateTimeField()
    expiry_time    = models.DateTimeField()
    location       = models.TextField()
    pickup_available = models.BooleanField(default=True)
    delivery_mode  = models.CharField(max_length=20, choices=DELIVERY_MODE_CHOICES, default='platform')
    notes          = models.TextField(blank=True)
    photo          = models.ImageField(upload_to='food/', blank=True, null=True)

    # Status & assignments
    status         = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    claimed_by     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                        null=True, blank=True, related_name='claimed_listings')
    delivery_guy   = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                        null=True, blank=True, related_name='deliveries')
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.food_type} by {self.donor}"