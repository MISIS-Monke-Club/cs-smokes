from favorites.models import Favorites
from pull_requests.models import PullRequest


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


class LineupStatusMixin:
    def check_status(self, data):
        is_single = False
        if isinstance(data, dict):
            data = [data]
            is_single = True

        grenade_ids = [item["grenade_id"] for item in data]
        grenades_status = PullRequest.objects.filter(
            lineup_id__in=grenade_ids
        ).values_list("lineup_id", "status", "id")
        status_dict = {
            lineup_id: {"status": status, "pr_id": pr_id}
            for lineup_id, status, pr_id in grenades_status
        }
        for item in data:
            grenade_id = item["grenade_id"]
            item["status"] = status_dict.get(grenade_id, {}).get(
                "status", "WAITING FOR CREATION"
            )
            item["pr_id"] = status_dict.get(grenade_id, {}).get("pr_id")

        return data[0] if is_single else data
