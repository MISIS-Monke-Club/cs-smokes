from rest_framework import serializers
from .models import PropertyList, Property


class PropertyListSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyList
        fields = "__all__"


class PropertyListPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyList
        fields = ["grenade_id", "property_id"]
        extra_kwargs = {
            "grenade_id": {"read_only": True},
        }


class PropertySerializer(serializers.ModelSerializer):

    class Meta:
        model = Property
        fields = "__all__"


class PropertyInlineSerializer(serializers.Serializer):
    property_id = serializers.IntegerField()
    name = serializers.CharField()
