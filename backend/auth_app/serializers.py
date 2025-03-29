from rest_framework import serializers
from .models import User
from django.contrib.auth.hashers import make_password
from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
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

User = get_user_model()


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


class LoginSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        return token


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("username", "email", "password", "password2")

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Пароли не совпадают"})
        attrs.pop("password2")
        return attrs

    def create(self, validated_data):
        user = User(
            username=validated_data["username"],
            email=validated_data["email"],
            first_name="",
            last_name="",
            avatar_url="",
            steam_link="",
            tg_id=0,
            is_banned=False,
        )
        user.set_password(validated_data["password"])
        user.save()
        return user
