from django.urls import path, re_path
from .maps_views import MapsListView, MapCreateView, MapRUDView, MapDetailView

urlpatterns = [
    re_path(r"maps/?$", MapsListView.as_view(), name="View all maps"),
    re_path(r"maps/?$", MapCreateView.as_view(), name="Post new map"),
    re_path(r"maps/<int:pk>/?$", MapDetailView.as_view(), name="Map info by ID"),
    re_path(
        r"maps/<int:pk>/?$",
        MapRUDView.as_view(),
        name="RUD(read,update,delete) operations with maps",
    ),
]
