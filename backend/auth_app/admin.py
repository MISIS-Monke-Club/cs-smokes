from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, AdminType, Admins


class UserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "first_name", "last_name", "is_banned")
    list_filter = ("is_banned",)
    fieldsets = (
        (None, {"fields": ("username", "email", "password")}),
        (
            "Personal Info",
            {
                "fields": (
                    "first_name",
                    "last_name",
                    "avatar_url",
                    "steam_link",
                    "tg_id",
                )
            },
        ),
        ("Permissions", {"fields": ("is_banned",)}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("username", "email", "password1", "password2"),
            },
        ),
    )
    search_fields = ("username", "email")
    ordering = ("username",)
    filter_horizontal = ()


@admin.register(AdminType)
class AdminTypeAdmin(admin.ModelAdmin):
    list_display = ("admin_type_id", "is_superuser", "is_base_admin", "is_editor")
    list_filter = ("is_superuser", "is_base_admin", "is_editor")


@admin.register(Admins)
class AdminsAdmin(admin.ModelAdmin):
    list_display = ("user_id", "admin_type_id")
    search_fields = ("user_id__username", "admin_type_id__admin_type_id")


admin.site.register(User, UserAdmin)
