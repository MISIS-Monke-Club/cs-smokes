from .models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from auth_app.models import (
    User,
    AdminType,
    Admins,
)


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
            "refresh_token": str(refresh),
            "access_token": str(refresh.access_token),
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
