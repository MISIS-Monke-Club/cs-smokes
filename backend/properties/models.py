from django.db import models
from lineups.models import Lineup


class Property(models.Model):
    property_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    value = models.CharField(max_length=255, null=True)

    def __str__(self):
        return self.name


class PropertyList(models.Model):
    property_id = models.ForeignKey(Property, on_delete=models.CASCADE)
    grenade_id = models.ForeignKey(Lineup, on_delete=models.CASCADE)

    class Meta:
        unique_together = ("property_id", "grenade_id")

    def __str__(self):
        return f"{self.property_id} — {self.grenade_id}"
