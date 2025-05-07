from django.urls import re_path
from .property_views import PropertyViews as pv, ProperyViewsRUD as pvrud
from .property_to_lineup_views import (
    PropertyListView,
    PropertyListPOSTView as plP,
    PropertyListDeleteView as pld,
)


urlpatterns = [
    re_path(r"properties/?$", pv.as_view(), name="properties-create-view"),
    re_path(
        r"properties/(?P<pk>\d+)/?$",
        pvrud.as_view(),
        name="properties-RUD",
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
]
