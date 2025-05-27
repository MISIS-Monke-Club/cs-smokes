import django_filters
from .models import Lineup


class LineupFilter(django_filters.FilterSet):
    is_approved = django_filters.BooleanFilter(field_name="is_approved")
    ordering = django_filters.OrderingFilter(
        fields=(
            ("created_at", "date_of_creation"),
            ("title", "by_alphabet"),
        )
    )

    class Meta:
        model = Lineup
        fields = ["is_approved"]
