from .models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from drf_spectacular.utils import extend_schema_field
from auth_app.models import (
    Map,
    GrenadeClass,
    User,
    Lineup,
    AdminType,
    Admins,
    Favorites,
    Property,
    PropertyList,
)


class MapSerializer(serializers.ModelSerializer):
    class Meta:
        model = Map
        fields = "__all__"


class MapDetailSerializer(serializers.ModelSerializer):
    map_lineups = serializers.SerializerMethodField()

    class Meta:
        model = Map
        fields = ["map_id", "name", "link", "image_link", "map_lineups"]

    def get_map_lineups(self, obj):
        lineups = Lineup.objects.filter(map_id=obj)
        serializer = LineupSerializer(lineups, many=True)
        return serializer.data


class GrenadeClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = GrenadeClass
        fields = ["grenade_class_id", "name", "description", "price"]


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


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        exclude = (
            "password",
            "last_login",
        )
        read_only_fields = ("id",)

    def validate(self, attrs):
        user_id = self.instance.pk if self.instance else None

        # Проверка email
        if "email" in attrs:
            email = attrs["email"]
            if User.objects.exclude(pk=user_id).filter(email=email).exists():
                raise serializers.ValidationError(
                    {"email": "Этот email уже используется."}
                )

        # Проверка username
        if "username" in attrs:
            username = attrs["username"]
            if User.objects.exclude(pk=user_id).filter(username=username).exists():
                raise serializers.ValidationError(
                    {"username": "Этот username уже используется."}
                )

        return attrs


class PropertyInlineSerializer(serializers.Serializer):
    property_id = serializers.IntegerField()
    name = serializers.CharField()


class LineupSerializer(serializers.ModelSerializer):
    grenade_class_id = serializers.PrimaryKeyRelatedField(
        queryset=GrenadeClass.objects.all(), write_only=True
    )
    grenade_class = GrenadeClassSerializer(source="grenade_class_id", read_only=True)

    property_list = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField(read_only=True)

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
            "is_favorite",
            "views",
            "preview_image_link",
            "grenade_class_id",
            "grenade_class",
            "property_list",
        ]

    def create(self, validated_data):
        return Lineup.objects.create(**validated_data)

    @extend_schema_field(serializers.BooleanField())
    def get_is_favorite(self, obj):
        request = self.context.get("request")
        if not request or not hasattr(request, "user"):
            return False
        user = request.user
        if user.is_authenticated:
            return Favorites.objects.filter(user_id=user, grenade_id=obj).exists()
        return False

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
