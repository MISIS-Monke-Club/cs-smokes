from .models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
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
        exclude = (
            "password",
            "last_login",
        )
        read_only_fields = ("id",)


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

    def validate(self, attrs):
        username_or_email = attrs.get("username")
        password = attrs.get("password")

        if "@" in username_or_email:
            try:
                user = User.objects.get(email=username_or_email)
                username = user.username
            except User.DoesNotExist:
                raise serializers.ValidationError(
                    {"username": "Пользователь с таким email не найден."}
                )
        else:
            username = username_or_email

        user = authenticate(
            request=self.context.get("request"), username=username, password=password
        )

        if not user:
            raise serializers.ValidationError(
                {
                    "username": "Неверные учетные данные.",
                    "password": "Неверные учетные данные.",
                }
            )

        refresh = self.get_token(user)

        data = {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UserResponseSerializer(user).data,
        }

        return data


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("username", "email", "password")

    def validate(self, attrs):
        email = attrs.get("email")
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError(
                {"email": "Пользователь с таким email уже существует"}
            )
        return attrs

    def create(self, validated_data):
        user = User(
            username=validated_data["username"],
            email=validated_data["email"],
            first_name="",
            last_name="",
            avatar_url="",
            steam_link="",
            is_banned=False,
        )
        user.set_password(validated_data["password"])
        user.save()
        return user

    def to_representation(self, instance):
        return UserResponseSerializer(instance).data


class UserResponseSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "user_id",
            "username",
            "email",
            "first_name",
            "last_name",
            "avatar_url",
            "steam_link",
            "tg_id",
            "is_banned",
        )
        read_only_fields = ("user_id", "is_banned")
