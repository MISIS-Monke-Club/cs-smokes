from rest_framework import serializers
from .models import Lineup
from favorites.models import Favorites
from grenade_class.models import GrenadeClass
from grenade_class.serializers import GrenadeClassSerializer
from properties.models import PropertyList
from properties.serializers import PropertyInlineSerializer
from drf_spectacular.utils import extend_schema_field


class LineupSerializer(serializers.ModelSerializer):
    grenade_class_id = serializers.PrimaryKeyRelatedField(
        queryset=GrenadeClass.objects.all(), write_only=True
    )
    grenade_class = GrenadeClassSerializer(source="grenade_class_id", read_only=True)

    property_list = serializers.SerializerMethodField()

    class Meta:
        model = Lineup
        fields = [
            "grenade_id",
            "map_id",
            "link_to_video",
            "user_id",
            "created_at",
            "title",
            "description",
            "is_approved",
            "views",
            "preview_image_link",
            "grenade_class_id",
            "grenade_class",
            "property_list",
        ]

    def create(self, validated_data):
        return Lineup.objects.create(**validated_data)

    @extend_schema_field(PropertyInlineSerializer(many=True))
    def get_property_list(self, obj):
        property_links = PropertyList.objects.filter(grenade_id=obj).select_related(
            "property_id"
        )
        return [
            {
                "property_id": pl.property_id.property_id,
                "name": pl.property_id.name,
                "value": pl.property_id.value,
            }
            for pl in property_links
        ]
