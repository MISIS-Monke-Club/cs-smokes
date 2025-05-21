from django.urls import re_path
from pull_requests.consumers import PRCommentConsumer

websocket_urlpatterns = [
    re_path(
        r"^api/pull_requests/(?P<pr_id>\d+)/comments/ws/$", PRCommentConsumer.as_asgi()
    ),
]
