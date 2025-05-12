from django.urls import re_path
from .lineups_views import (
    LineupViews as lv,
    LineupRUDViews as lvrud,
    ChangeGrenadeClassView as cgcV,
    LineupViewSorts,
    LineupViewFilters,
)

urlpatterns = [
    re_path(r"lineups/?$", lv.as_view(), name="lineups-create-view"),
    re_path(
        r"lineups/(?P<pk>\d+)/?$",
        lvrud.as_view(),
        name="lineups-RUD",
    ),
    re_path(
        r"lineups/(?P<pk>\d+)/change-grenade-class/?$",
        cgcV.as_view(),
        name="change grenade-class",
    ),
    re_path(
        r"lineups/view_filters/?$",
        LineupViewFilters.as_view(),
        name="All filters",
    ),
    re_path(
        r"lineups/view_sorts/?$",
        LineupViewSorts.as_view(),
        name="All sorts",
    ),
]
