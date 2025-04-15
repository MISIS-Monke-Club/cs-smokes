from django.urls import re_path
from .maps_views import MapsView, MapDetailRUDView
from .greande_class_views import GrenadeClassesView as gcv, GrenadeClassRUDVIew as gcrud
from .property_views import PropertyViews as pv, ProperyViewsRUD as pvrud
from .lineups_views import (
    LineupViews as lv,
    LineupRUDViews as lvrud,
    ChangeGrenadeClassView as cgcV,
)
from .property_to_lineup_views import (
    PropertyListView,
    PropertyListDeleteView as pld,
    PropertyListPOSTView as plP,
)

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
    re_path(r"lineups/?$", lv.as_view(), name="lineups-create-view"),
    re_path(
        r"lineups/(?P<pk>\d+)/?$",
        lvrud.as_view(),
        name="lineups-RUD",
    ),
    re_path(
        r"^property-list?/$",
        PropertyListView.as_view(),
        name="property-list--View",
    ),
    re_path(
        r"lineups/(?P<pk>\d+)/properties/?$",
        plP.as_view(),
        name="property-list-post",
    ),
    re_path(
        r"lineups/(?P<grenade_id>\d+)/properties/(?P<property_id>\d+)/?$",
        pld.as_view(),
        name="property-list-delete",
    ),
    re_path(
        r"lineups/(?P<pk>\d+)/change-grenade-class/?$",
        cgcV.as_view(),
        name="change grenade-class",
    ),
]
