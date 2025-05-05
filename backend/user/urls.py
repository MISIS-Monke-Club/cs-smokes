from django.urls import re_path
from .views import UserListAPIView, UserDetailAPIView

urlpatterns = [
    re_path(r"^users/?$", UserListAPIView.as_view()),
    re_path(r"^users/(?P<id>\d+)/?$", UserDetailAPIView.as_view()),
]
