from django.contrib import admin
from .models import GrenadeClass


@admin.register(GrenadeClass)
class GrenadeClassAdmin(admin.ModelAdmin):
    list_display = ("grenade_class_id", "name", "price", "description")
    search_fields = ("name", "description")
    ordering = ("grenade_class_id",)
