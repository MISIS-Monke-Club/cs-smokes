class LineupStatusFavoriteMixin:
    def add_status_and_favorite(self, lineups_data, request):
        if hasattr(self, "annotate_is_favorite"):
            lineups_data = self.annotate_is_favorite(lineups_data, request.user)
        if hasattr(self, "check_status"):
            lineups_data = self.check_status(lineups_data)
        return lineups_data
