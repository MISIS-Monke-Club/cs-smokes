from rest_framework import serializers
from pull_requests.models import PullRequest, Comment
from auth_app.models import User
from lineups.models import Lineup
from lineups.serializers import LineupSerializer
from auth_app.serializers import AdminTypeSerializer


def is_admin(user):
    return getattr(user, "is_admin", False) or getattr(
        getattr(user, "admin_type", None), "is_superuser", False
    )


class UserShortSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="user_id")

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "avatar_url"]


class UserWithAdminTypeSerializer(serializers.ModelSerializer):
    admin_type = AdminTypeSerializer()

    class Meta:
        model = User
        fields = [
            "user_id",
            "username",
            "first_name",
            "last_name",
            "avatar_url",
            "admin_type",
        ]


class PullRequestSerializer(serializers.ModelSerializer):
    creator = UserShortSerializer(read_only=True)
    approver = UserWithAdminTypeSerializer(read_only=True)
    lineup = LineupSerializer(read_only=True)

    class Meta:
        model = PullRequest
        fields = [
            "id",
            "lineup",
            "creator",
            "approver",
            "status",
            "created_at",
            "closed_at",
        ]
        read_only_fields = ["created_at", "closed_at"]


class PullRequestCreateSerializer(serializers.ModelSerializer):
    lineup_id = serializers.IntegerField()

    class Meta:
        model = PullRequest
        fields = ["lineup_id"]

    def create(self, validated_data):
        lineup_id = validated_data["lineup_id"]
        try:
            lineup = Lineup.objects.get(grenade_id=lineup_id)
        except Lineup.DoesNotExist:
            raise serializers.ValidationError(
                "Lineup with the provided ID does not exist."
            )

        pull_request = PullRequest.objects.create(
            lineup=lineup, creator=self.context["request"].user, status="OPEN"
        )
        return pull_request


class PullRequestUpdateStatusSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(choices=PullRequest.STATUS_CHOICES)
    approver_id = serializers.IntegerField(required=False)

    class Meta:
        model = PullRequest
        fields = ["status", "approver_id"]

    def validate(self, attrs):
        user = self.context["request"].user
        if not is_admin(user):
            raise serializers.ValidationError("Only admin users can change the status.")
        return attrs

    def update(self, instance, validated_data):
        user = self.context["request"].user
        instance.status = validated_data["status"]
        instance.approver_id = validated_data.get("approver_id", user.user_id)
        instance.save()
        return instance


class CreaterSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "user_id",
            "username",
            "avatar_url",
            "first_name",
            "last_name",
            "role",
        ]

    def get_role(self, obj):
        return "admin" if obj.is_staff else "user"


class CommentSerializer(serializers.ModelSerializer):
    creator = CreaterSerializer(source="author")

    class Meta:
        model = Comment
        fields = ["id", "text", "creator", "created_at"]
        read_only_fields = ["created_at"]

    def create(self, validated_data):
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)
