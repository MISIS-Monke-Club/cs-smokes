from django.db import models
from maps.models import Map
from auth_app.models import User
from grenade_class.models import GrenadeClass


class Lineup(models.Model):
    grenade_id = models.AutoField(primary_key=True)
    map_id = models.ForeignKey(Map, on_delete=models.CASCADE)
    link_to_video = models.CharField(max_length=255, null=True)
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    title = models.CharField(max_length=255)
    description = models.TextField(null=True)
    is_approved = models.BooleanField(default=False)
    views = models.IntegerField(default=0)
    preview_image_link = models.ImageField(
        upload_to="lineups/", verbose_name="Фото", null=True
    )
    grenade_class_id = models.ForeignKey(GrenadeClass, on_delete=models.CASCADE)

    def __str__(self):
        return self.title
