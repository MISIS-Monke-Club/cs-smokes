from rest_framework import serializers
from .models import Map
from lineups.models import Lineup
from lineups.serializers import LineupSerializer


class MapSerializer(serializers.ModelSerializer):
    class Meta:
        model = Map
        fields = "__all__"


class MapDetailSerializer(serializers.ModelSerializer):
    map_lineups = serializers.SerializerMethodField()

    class Meta:
        model = Map
        fields = ["map_id", "name", "link", "image_link", "map_lineups"]

    def get_map_lineups(self, obj):
        lineups = Lineup.objects.filter(map_id=obj)
        serializer = LineupSerializer(lineups, many=True)
        return serializer.data
