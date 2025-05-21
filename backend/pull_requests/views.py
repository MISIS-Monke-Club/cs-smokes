from rest_framework import generics, permissions
from rest_framework.exceptions import NotFound
from user.mixins import IsAdminOrCreator, AdminOnlyForUpdate
from pull_requests.models import PullRequest, Comment
from pull_requests.serializers import (
    PullRequestSerializer,
    PullRequestCreateSerializer,
    PullRequestUpdateStatusSerializer,
    CommentSerializer,
)


def is_admin(user):
    return user.is_superuser


class PullRequestListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PullRequestCreateSerializer
        return PullRequestSerializer

    def get_queryset(self):
        return PullRequest.objects.all()

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user, status="OPEN")


class PullRequestRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PullRequest.objects.all()
    permission_classes = [
        permissions.IsAuthenticated,
        AdminOnlyForUpdate,
        IsAdminOrCreator,
    ]
    lookup_field = "id"

    def get_serializer_class(self):
        if self.request.method in ["PATCH", "PUT"]:
            return PullRequestUpdateStatusSerializer
        return PullRequestSerializer


class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_url_kwarg = "id"

    def get_queryset(self):
        return Comment.objects.filter(pull_request_id=self.kwargs["id"]).order_by(
            "created_at"
        )

    def perform_create(self, serializer):
        pr_id = self.kwargs["id"]
        try:
            pr = PullRequest.objects.get(id=pr_id)
        except PullRequest.DoesNotExist:
            raise NotFound("Pull Request не найден")

        serializer.save(pull_request=pr, author=self.request.user)


class CommentRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]
