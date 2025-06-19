from django.urls import re_path
from .views import (
    PullRequestListCreateView,
    PullRequestRetrieveUpdateDeleteView,
    CommentListCreateView,
    CommentRetrieveUpdateDeleteView,
    ApprovePullRequestView,
    RejectPullRequestView,
    CancelPullRequestView,
)

urlpatterns = [
    re_path(
        r"^pull_requests/?$",
        PullRequestListCreateView.as_view(),
        name="pullrequest-list-create",
    ),
    re_path(
        r"^pull_requests/(?P<id>\d+)/?$",
        PullRequestRetrieveUpdateDeleteView.as_view(),
        name="pullrequest-detail",
    ),
    re_path(
        r"^pull_requests/(?P<id>\d+)/comments/?$",
        CommentListCreateView.as_view(),
        name="pullrequestcomment-list-create",
    ),
    re_path(
        r"^comments/(?P<pk>\d+)/?$",
        CommentRetrieveUpdateDeleteView.as_view(),
        name="pullrequestcomment-detail",
    ),
    re_path(
        r"^pull_requests/(?P<id>\d+)/approve/?$",
        ApprovePullRequestView.as_view(),
        name="pullrequest-approve",
    ),
    re_path(
        r"^pull_requests/(?P<id>\d+)/reject/?$",
        RejectPullRequestView.as_view(),
        name="pullrequest-reject",
    ),
    re_path(
        r"^pull_requests/(?P<id>\d+)/cancel/?$",
        CancelPullRequestView.as_view(),
        name="pullrequest-cancel",
    ),
]
