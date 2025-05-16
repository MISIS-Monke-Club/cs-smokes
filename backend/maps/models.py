from django.db import models


class Map(models.Model):
    map_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    link = models.CharField(max_length=255, null=True)
    is_esports_pool = models.BooleanField(
        null=False, default=False, verbose_name="Есть ли в пуле фейсита/турниров"
    )
    image_link = models.ImageField(upload_to="maps/", verbose_name="Фото", null=True)

    def __str__(self):
        return self.name
