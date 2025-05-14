from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Map
from .serializers import MapSerializer, MapDetailSerializer
from drf_spectacular.utils import extend_schema, OpenApiExample
from rest_framework.permissions import IsAuthenticated
from django.core.cache import cache


class MapsView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        description="Получить список всех карт",
        responses={200: MapSerializer(many=True)},
    )
    def get(self, request):

        cache_key = "maps_list"
        cached_data = cache.get(cache_key)

        if cached_data is not None:
            return Response(cached_data, status=status.HTTP_200_OK)

        maps = Map.objects.all()
        serializer = MapSerializer(maps, many=True, context={"request": request})
        cache.set(cache_key, serializer.data, timeout=60 * 15)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        description="Создать новую карту (только для администраторов)",
        request=MapSerializer,
        responses={
            201: MapSerializer,
            400: None,
            401: None,
            403: None,
        },
        examples=[
            OpenApiExample(
                "Пример запроса",
                value={
                    "name": "Новая карта",
                    "link": "https://example.com/new_map",
                    "image_link": "https://example.com/new_map_image.jpg",
                },
                request_only=True,
            ),
        ],
    )
    def post(self, request):
        serializer = MapSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            cache.delete("maps_list")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MapDetailRUDView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        description="Получить детальную информацию о карте",
        responses={
            200: MapSerializer,
            404: None,
        },
    )
    def get(self, request, pk):

        cache_key = f"map_detail_{pk}"
        cached_data = cache.get(cache_key)

        if cached_data is not None:
            return Response(cached_data)

        map_obj = get_object_or_404(Map, pk=pk)
        serializer = MapDetailSerializer(map_obj, context={"request": request})
        cache.set(cache_key, serializer.data, timeout=60 * 15)
        return Response(serializer.data)

    @extend_schema(
        description="Полное обновление карты (только для администраторов)",
        request=MapSerializer,
        responses={
            200: MapSerializer,
            400: None,
            401: None,
            403: None,
            404: None,
        },
    )
    def put(self, request, pk):
        map_obj = get_object_or_404(Map, pk=pk)
        serializer = MapSerializer(map_obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            cache.delete(f"map_detail_{pk}")
            cache.delete("maps_list")
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        description="Частичное обновление карты (только для администраторов)",
        request=MapSerializer,
        responses={
            200: MapSerializer,
            400: None,
            401: None,
            403: None,
            404: None,
        },
    )
    def patch(self, request, pk):
        map_obj = get_object_or_404(Map, pk=pk)
        serializer = MapSerializer(map_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            cache.delete(f"map_detail_{pk}")
            cache.delete("maps_list")
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        description="Удаление карты (только для администраторов)",
        responses={
            204: None,
            401: None,
            403: None,
            404: None,
        },
    )
    def delete(self, request, pk):
        map_obj = get_object_or_404(Map, pk=pk)
        map_obj.delete()
        cache.delete(f"map_detail_{pk}")
        cache.delete("maps_list")
        return Response(status=status.HTTP_204_NO_CONTENT)
