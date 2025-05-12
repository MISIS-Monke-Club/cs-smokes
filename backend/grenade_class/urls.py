from django.urls import re_path
from .views import GrenadeClassesView as gcv, GrenadeClassRUDVIew as gcrud


urlpatterns = [
    re_path(r"grenade-classes/?$", gcv.as_view(), name="grenade-classes-create-view"),
    re_path(
        r"grenade-classes/(?P<pk>\d+)/?$",
        gcrud.as_view(),
        name="grenade-classes-create-view",
    ),
]
