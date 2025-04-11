from django.urls import re_path
from .maps_views import MapsView, MapDetailRUDView
from .greande_class_views import GrenadeClassesView as gcv, GrenadeClassRUDVIew as gcrud
from .property_views import PropertyViews as pv, ProperyViewsRUD as pvrud

urlpatterns = [
    re_path(r"maps/?$", MapsView.as_view(), name="maps-list-create"),
    re_path(r"maps/(?P<pk>\d+)/?$", MapDetailRUDView.as_view(), name="map-detail-rud"),
    re_path(r"grenade-classes/?$", gcv.as_view(), name="grenade-classes-create-view"),
    re_path(
        r"grenade-classes/(?P<pk>\d+)/?$",
        gcrud.as_view(),
        name="grenade-classes-create-view",
    ),
    re_path(r"properties/?$", pv.as_view(), name="properties-create-view"),
    re_path(
        r"properties/(?P<pk>\d+)/?$",
        pvrud.as_view(),
        name="properties-RUD",
    ),
]
