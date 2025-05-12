from rest_framework import serializers
from .models import Favorites
from lineups.models import Lineup
from auth_app.serializers import UserSerializer
from lineups.serializers import LineupSerializer


class FavoritesSerializer(serializers.ModelSerializer):
    user_id = UserSerializer()
    grenade_id = LineupSerializer()

    class Meta:
        model = Favorites
        fields = "__all__"


class FavoritesCreateSerializer(serializers.ModelSerializer):
    grenade_id = serializers.PrimaryKeyRelatedField(queryset=Lineup.objects.all())

    class Meta:
        model = Favorites
        fields = ["grenade_id"]

    def validate(self, attrs):
        request = self.context.get("request")
        if request is None:
            raise serializers.ValidationError(
                {"non_field_errors": ["Request context is missing"]}
            )

        user = request.user
        grenade = attrs["grenade_id"]

        if Favorites.objects.filter(user_id=user, grenade_id=grenade).exists():
            raise serializers.ValidationError({"non_field_errors": ["Уже в избранном"]})
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if (
            not request
            or not hasattr(request, "user")
            or not request.user.is_authenticated
        ):
            raise serializers.ValidationError(
                {"non_field_errors": ["Пользователь не авторизован"]}
            )

        favorite = Favorites.objects.create(
            user_id=request.user, grenade_id=validated_data["grenade_id"]
        )
        return favorite
