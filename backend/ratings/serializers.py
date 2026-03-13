# ratings/serializers.py
from rest_framework import serializers
from .models import Rating


class RatingSerializer(serializers.ModelSerializer):
    reviewer_name   = serializers.SerializerMethodField()
    rated_user_name = serializers.SerializerMethodField()
    date            = serializers.SerializerMethodField()

    class Meta:
        model  = Rating
        fields = [
            'id',
            'reviewer_name',
            'rated_user_name',
            'rating',
            'comment',
            'date',
            'created_at',
            'listing',
        ]
        read_only_fields = ['id', 'reviewer_name', 'rated_user_name', 'created_at', 'date']

    def get_reviewer_name(self, obj):
        return obj.reviewer.email

    def get_rated_user_name(self, obj):
        return obj.rated_user.email

    def get_date(self, obj):
        return obj.created_at.strftime('%b %d') if obj.created_at else ''