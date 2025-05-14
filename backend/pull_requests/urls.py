from django.urls import path
from .views import (
    PullRequestListCreateView,
    PullRequestRetrieveUpdateDeleteView,
    CommentListCreateView,
    CommentRetrieveUpdateDeleteView,
    CommentWebsocketView,
)

urlpatterns = [
    path(
        "pull_requests/",
        PullRequestListCreateView.as_view(),
        name="pullrequest-list-create",
    ),
    path(
        "pull_requests/<int:id>/",
        PullRequestRetrieveUpdateDeleteView.as_view(),
        name="pullrequest-detail",
    ),
    path(
        "pull_requests/<int:id>/comments/",
        CommentListCreateView.as_view(),
        name="pullrequestcomment-list-create",
    ),
    path(
        "comments/<int:id>/",
        CommentRetrieveUpdateDeleteView.as_view(),
        name="pullrequestcomment-detail",
    ),
    path(
        "pull_requests/<int:id>/comments/ws/",
        CommentWebsocketView.as_view(),
        name="pullrequestcomment-ws",
    ),
]
