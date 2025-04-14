from django.urls import re_path
from .views import FavoritesView

urlpatterns = [
    re_path(r"^favorites/$", FavoritesView.as_view(), name="favorites_add"),
    re_path(
        r"^favorites/(?P<userId>\d+)/$", FavoritesView.as_view(), name="favorites_get"
    ),
    re_path(
        r"^favorites/(?P<grenadeId>\d+)/$",
        FavoritesView.as_view(),
        name="favorites_delete",
    ),
]
