from django.contrib import admin
from .models import Favorites


@admin.register(Favorites)
class FavoritesAdmin(admin.ModelAdmin):
    list_display = ("id", "user_id", "grenade_id", "created_at")
    list_filter = ("created_at",)
    search_fields = ("user_id__username", "grenade_id__title")
    ordering = ("-created_at",)
