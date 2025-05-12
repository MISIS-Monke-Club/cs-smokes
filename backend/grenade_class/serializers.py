from rest_framework import serializers
from .models import GrenadeClass


class GrenadeClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = GrenadeClass
        fields = ["grenade_class_id", "name", "description", "price"]
