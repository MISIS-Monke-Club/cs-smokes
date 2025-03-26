from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from auth_app.models import Map
from auth_app.serializers import MapSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes


class MapsListView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        description="Получить список всех карт",
        responses={200: MapSerializer(many=True)},
    )
    def get(self, request):
        maps = Map.objects.all()
        serializer = MapSerializer(maps, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MapDetailView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        description="Получить детальную информацию о конкретной карте",
        responses={200: MapSerializer},
    )
    def get(self, request, pk):
        maps = get_object_or_404(Map, pk=pk)
        serializer = MapSerializer(maps)
        return Response(serializer.data, status=status.HTTP_200_OK)


class MapCreateView(APIView):
    # permission_classes = [IsAdminUser, IsAuthenticated]

    @extend_schema(
        description="Создать новую карту",
        request=MapSerializer,
        responses={
            201: MapSerializer,
            401: None,
        },
        examples=[
            OpenApiExample(
                "Example",
                value={
                    "name": "Пример карты",
                    "link": "https://example.com/map",
                    "image_link": "https://example.com/map_image.jpg",
                },
                request_only=True,
            ),
        ],
    )
    def post(self, request):
        serializer = MapSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(status=status.HTTP_401_UNAUTHORIZED)


class MapRUDView(APIView):
    @extend_schema(
        description="Обновить карту (полное обновление)",
        request=MapSerializer,
        responses={
            200: MapSerializer,
            401: None,
        },
    )
    def put(self, request, pk):
        maps = get_object_or_404(Map, pk=pk)
        serializer = MapSerializer(maps, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(status=status.HTTP_401_UNAUTHORIZED)

    @extend_schema(
        description="Обновить карту (частичное обновление)",
        request=MapSerializer,
        responses={
            200: MapSerializer,
            401: None,
        },
    )
    def patch(self, request, pk):
        maps = get_object_or_404(Map, pk=pk)
        serializer = MapSerializer(maps, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(status=status.HTTP_401_UNAUTHORIZED)

    @extend_schema(
        description="Удалить карту",
        responses={
            204: None,
        },
    )
    def delete(self, request, pk):
        maps = get_object_or_404(Map, pk=pk)
        maps.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
