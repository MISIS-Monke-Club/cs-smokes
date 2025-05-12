from django.db import models


class Map(models.Model):
    map_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    link = models.CharField(max_length=255, null=True)
    image_link = models.CharField(max_length=255, null=True)

    def __str__(self):
        return self.name
