from django.contrib import admin
from .models import Map


@admin.register(Map)
class MapAdmin(admin.ModelAdmin):
    list_display = ("map_id", "name", "link", "image_link")
    search_fields = ("name",)
    ordering = ("name",)
