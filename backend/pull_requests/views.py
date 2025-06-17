from rest_framework import generics, permissions
from rest_framework.exceptions import NotFound
from user.mixins import IsAdminOrCreator, AdminOnlyForUpdate
from pull_requests.models import PullRequest, Comment
from rest_framework.response import Response
from rest_framework import status
from pull_requests.serializers import (
    PullRequestSerializer,
    PullRequestCreateSerializer,
    PullRequestUpdateStatusSerializer,
    CommentSerializer,
)
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound, PermissionDenied
from user.mixins import IsAdminOrCreator
from django.utils import timezone


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

    def put(self, request, *args, **kwargs):
        return Response(
            {"detail": "PUT метод не поддерживается. Используйте PATCH."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def get_serializer_class(self):
        if self.request.method == "PATCH":
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

    def put(self, request, *args, **kwargs):
        return Response(
            {"detail": "PUT метод не поддерживается. Используйте PATCH."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )


class ApprovePullRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, id):
        if not request.user.is_staff:
            raise PermissionDenied("Only admin can approve pull requests.")

        try:
            pr = PullRequest.objects.get(id=id)
        except PullRequest.DoesNotExist:
            raise NotFound("Pull request not found.")

        pr.status = "APPROVED"
        pr.approver = request.user
        pr.save()
        return Response({"detail": "Pull request approved."}, status=status.HTTP_200_OK)


class RejectPullRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, id):
        if not request.user.is_staff:
            raise PermissionDenied("Only admin can reject pull requests.")

        try:
            pr = PullRequest.objects.get(id=id)
        except PullRequest.DoesNotExist:
            raise NotFound("Pull request not found.")

        pr.status = "REJECTED"
        pr.approver = request.user
        pr.save()
        return Response({"detail": "Pull request rejected."}, status=status.HTTP_200_OK)


class CancelPullRequestView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrCreator]

    def patch(self, request, id):
        try:
            pr = PullRequest.objects.get(id=id)
        except PullRequest.DoesNotExist:
            raise NotFound("Pull request not found.")

        if pr.creator != request.user and not request.user.is_staff:
            raise PermissionDenied("You are not allowed to cancel this pull request.")

        pr.status = "CLOSED"
        pr.closed_at = timezone.now()
        pr.save()
        return Response(
            {"detail": "Pull request cancelled."}, status=status.HTTP_200_OK
        )
