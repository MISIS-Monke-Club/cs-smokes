from django.contrib import admin
from .models import Property, PropertyList


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ("property_id", "name", "value")
    search_fields = ("name",)
    ordering = ("property_id",)


@admin.register(PropertyList)
class PropertyListAdmin(admin.ModelAdmin):
    list_display = ("property_id", "grenade_id")
    list_filter = ("property_id", "grenade_id")
    ordering = ("property_id",)
