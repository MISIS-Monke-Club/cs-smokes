from rest_framework import serializers
from pull_requests.models import PullRequest, PullRequestComment


class PullRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = PullRequest
        fields = "__all__"


class PullRequestCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PullRequestComment
        fields = "__all__"
