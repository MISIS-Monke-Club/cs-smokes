from django.urls import path
from .maps_views import MapsListView, MapCreateView, MapRUDView, MapDetailView

urlpatterns = [
    path("maps/", MapsListView.as_view(), name="View all maps"),
    path("maps/create/", MapCreateView.as_view(), name="Post new map"),
    path("maps/<int:pk>/", MapDetailView.as_view(), name="Map info by ID"),
    path(
        "maps/<int:pk>/update",
        MapRUDView.as_view(),
        name="RUD(read,update,delete) operations with maps",
    ),
]
