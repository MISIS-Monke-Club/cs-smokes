from favorites.models import Favorites


class IsFavoriteMixin:
    def annotate_is_favorite(self, data, user):
        is_single = False
        if isinstance(data, dict):
            data = [data]
            is_single = True

        if not user.is_authenticated:
            for item in data:
                item["is_favorite"] = False
            return data[0] if is_single else data

        grenade_ids = [item["grenade_id"] for item in data]
        favorite_ids = set(
            Favorites.objects.filter(
                user_id=user, grenade_id__in=grenade_ids
            ).values_list("grenade_id", flat=True)
        )

        for item in data:
            item["is_favorite"] = item["grenade_id"] in favorite_ids

        return data[0] if is_single else data
