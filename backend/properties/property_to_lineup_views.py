from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from auth_app.models import PropertyList, Lineup
from auth_app.serializers import (
    PropertyListSerializer,
    PropertyListPostSerializer as PLPSerializer,
)
from django.shortcuts import get_object_or_404


class PropertyListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Получить все связи между гранатами и свойствами", tags=["PropertyList"]
    )
    def get(self, request):
        grenade_id = request.query_params.get("grenade_id")
        queryset = PropertyList.objects.all()
        if grenade_id:
            queryset = queryset.filter(grenade_id=grenade_id)

        serializer = PropertyListSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PropertyListDeleteView(APIView):

    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Удалить связь между гранатой и свойством", tags=["Lineup"])
    def delete(self, request, grenade_id, property_id):
        obj = get_object_or_404(
            PropertyList, grenade_id=grenade_id, property_id=property_id
        )
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PropertyListPOSTView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Создать связь grenade_id <-> property_id",
        request=PLPSerializer,
        tags=["Lineup"],
    )
    def post(self, request, pk):
        serializer = PLPSerializer(data=request.data)
        if serializer.is_valid():
            grenade = get_object_or_404(Lineup, pk=pk)
            serializer.save(grenade_id=grenade)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
