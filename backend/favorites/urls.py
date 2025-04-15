from django.urls import re_path
from .views import FavoritesAddView, FavoritesView

urlpatterns = [
    re_path(r"^favorites/$", FavoritesAddView.as_view(), name="favorite_add"),
    re_path(
        r"^favorites/(?P<pk>\d+)/$",
        FavoritesView.as_view(),
        name="favorite_get_by_user",
    ),
]
