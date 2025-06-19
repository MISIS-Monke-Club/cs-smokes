from rest_framework import serializers
from .models import Lineup
from favorites.models import Favorites
from grenade_class.models import GrenadeClass
from grenade_class.serializers import GrenadeClassSerializer
from properties.models import PropertyList
from properties.serializers import PropertyInlineSerializer
from drf_spectacular.utils import extend_schema_field
from auth_app.models import User
from favorites.models import Favorites


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["user_id", "username", "avatar_url", "first_name", "last_name"]


class LineupSerializer(serializers.ModelSerializer):
    grenade_class_id = serializers.PrimaryKeyRelatedField(
        queryset=GrenadeClass.objects.all(), write_only=True
    )
    grenade_class = GrenadeClassSerializer(source="grenade_class_id", read_only=True)
    creator = UserProfileSerializer(source="user_id", read_only=True)
    property_list = serializers.SerializerMethodField()
    preview_image_link = serializers.ImageField(required=False)

    class Meta:
        model = Lineup
        fields = [
            "user_id",
            "grenade_id",
            "map_id",
            "link_to_video",
            "creator",
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


class LineupToPullRequestSerializer(serializers.ModelSerializer):
    grenade_class_id = serializers.PrimaryKeyRelatedField(
        queryset=GrenadeClass.objects.all(), write_only=True
    )
    grenade_class = GrenadeClassSerializer(source="grenade_class_id", read_only=True)
    creator = UserProfileSerializer(source="user_id", read_only=True)
    property_list = serializers.SerializerMethodField()
    preview_image_link = serializers.ImageField(required=False)
    is_favorite = serializers.SerializerMethodField()

    class Meta:
        model = Lineup
        fields = [
            "user_id",
            "grenade_id",
            "map_id",
            "link_to_video",
            "creator",
            "created_at",
            "title",
            "description",
            "is_approved",
            "views",
            "preview_image_link",
            "grenade_class_id",
            "grenade_class",
            "property_list",
            "is_favorite",
        ]

    def create(self, validated_data):
        return Lineup.objects.create(**validated_data)

    def get_is_favorite(self, obj):
        user = self.context["request"].user
        if not user.is_authenticated:
            return False
        return Favorites.objects.filter(user_id=user, grenade_id=obj).exists()

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
