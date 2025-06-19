from django.contrib import admin
from .models import Lineup


@admin.register(Lineup)
class LineupAdmin(admin.ModelAdmin):
    list_display = (
        "grenade_id",
        "title",
        "map_id",
        "user_id",
        "grenade_class_id",
        "is_approved",
        "views",
        "created_at",
    )
    list_filter = ("is_approved", "map_id", "grenade_class_id", "created_at")
    search_fields = ("title", "description", "user_id__username")
    readonly_fields = ("created_at", "views")
    ordering = ("-created_at",)
