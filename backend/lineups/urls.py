from django.urls import re_path
from .maps_views import MapsView, MapDetailRUDView

urlpatterns = [
    re_path(r"maps/?$", MapsView.as_view(), name="maps-list-create"),
    re_path(r"maps/(?P<pk>\d+)/?$", MapDetailRUDView.as_view(), name="map-detail-rud"),
]
