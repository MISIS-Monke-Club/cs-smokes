from django.db import models


class GrenadeClass(models.Model):
    grenade_class_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.CharField(max_length=255, null=True, blank=True)
    price = models.IntegerField(default=0)

    def __str__(self):
        return self.name
