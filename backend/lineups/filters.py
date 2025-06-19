import django_filters
from .models import Lineup


class LineupFilter(django_filters.FilterSet):
    is_approved = django_filters.BooleanFilter(field_name="is_approved")
    ordering = django_filters.OrderingFilter(
        fields=[
            ("created_at", "date_of_creation"),
            ("title", "by_alphabet"),
        ]
    )
    query = django_filters.CharFilter(method="filter_by_search", label="Поиск")

    by_user_name = django_filters.CharFilter(
        method="filter_by_user_name", label="По имени пользователя"
    )

    def filter_by_search(self, queryset, name, value):
        return queryset.filter(
            django_filters.filters.Q(title__icontains=value)
            | django_filters.filters.Q(description__icontains=value)
        )

    def filter_by_user_name(self, queryset, name, value):
        return queryset.filter(user_id__username__iexact=value)

    class Meta:
        model = Lineup
        fields = ["is_approved"]
