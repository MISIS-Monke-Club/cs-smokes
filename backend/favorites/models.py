from django.db import models
from auth_app.models import User
from lineups.models import Lineup


class Favorites(models.Model):
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)
    grenade_id = models.ForeignKey(Lineup, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (("user_id", "grenade_id"),)

    def __str__(self):
        return f"Favorite {self.user_id} - {self.grenade_id}"
