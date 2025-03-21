from rest_framework import serializers
from auth_app.models import (
    Map,
    GrenadeClass,
    LineupTypeValues,
    LineupType,
    User,
    Lineup,
    AdminType,
    Admins,
    Favorites,
)


class MapSerializer(serializers.ModelSerializer):
    class Meta:
        model = Map
        fields = "__all__"


class GrenadeClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = GrenadeClass
        fields = "__all__"


class LineupTypeValuesSerializer(serializers.ModelSerializer):
    class Meta:
        model = LineupTypeValues
        fields = "__all__"


class LineupTypeSerializer(serializers.ModelSerializer):
    value_id = LineupTypeValuesSerializer()

    class Meta:
        model = LineupType
        fields = "__all__"


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = "__all__"


class LineupSerializer(serializers.ModelSerializer):
    map_id = MapSerializer()
    grenade_class_id = GrenadeClassSerializer()
    type_id = LineupTypeSerializer()
    user_id = UserSerializer()

    class Meta:
        model = Lineup
        fields = "__all__"


class AdminTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminType
        fields = "__all__"


class AdminsSerializer(serializers.ModelSerializer):
    user_id = UserSerializer()
    admin_type_id = AdminTypeSerializer()

    class Meta:
        model = Admins
        fields = "__all__"


class FavoritesSerializer(serializers.ModelSerializer):
    user_id = UserSerializer()
    grenade_id = LineupSerializer()

    class Meta:
        model = Favorites
        fields = "__all__"
