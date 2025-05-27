import django_filters
from .models import Map
from django.db.models import Count


class MapFilter(django_filters.FilterSet):
    is_esports_pool = django_filters.BooleanFilter(field_name="is_esports_pool")
    ordering = django_filters.OrderingFilter(
        fields=(
            ("quantity", "quantity"),
            ("name", "by_alphabet"),
        )
    )

    class Meta:
        model = Map
        fields = ["is_esports_pool"]

    def filter_queryset(self, queryset):
        queryset = queryset.annotate(quantity=Count("lineup"))
        return super().filter_queryset(queryset)
