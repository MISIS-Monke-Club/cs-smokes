from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Map
from .serializers import MapSerializer, MapDetailSerializer
from drf_spectacular.utils import extend_schema, OpenApiExample, OpenApiParameter
from rest_framework.permissions import IsAuthenticated
from django.core.cache import cache
from .filters import MapFilter
from django_filters.rest_framework import DjangoFilterBackend
import hashlib
from urllib.parse import urlencode
from rest_framework.parsers import MultiPartParser, FormParser


class MapsView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        description="Получить список всех карт",
        responses={200: MapSerializer(many=True)},
        parameters=[
            OpenApiParameter(
                name="is_esports_pool",
                type=bool,
                description="Фильтр по наличию в пуле киберспортивных карт",
                required=False,
            ),
            OpenApiParameter(
                name="ordering",
                type=str,
                description="Сортировка результатов",
                enum=["quantity", "-quantity", "by_alphabet", "-by_alphabet"],
                required=False,
            ),
        ],
    )
    def get(self, request):
        query_string = urlencode(sorted(request.query_params.items()))
        query_hash = hashlib.sha256(query_string.encode()).hexdigest()
        cache_key = f"map_list_{query_hash}"

        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data, status=status.HTTP_200_OK)

        queryset = Map.objects.all()
        filterset = MapFilter(request.GET, queryset=queryset)

        if not filterset.is_valid():
            return Response(filterset.errors, status=status.HTTP_400_BAD_REQUEST)

        lineups = filterset.qs
        serializer = MapSerializer(lineups, many=True, context={"request": request})

        cache.set(cache_key, serializer.data, timeout=60 * 15)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        description="Создать новую карту (только для администраторов)",
        request={
            "multipart/form-data": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "link": {"type": "string"},
                    "is_esports_pool": {"type": "boolean"},
                    "image_link": {"type": "string", "format": "binary"},
                },
                "required": ["name", "is_esports_pool"],
            }
        },
        responses={201: MapSerializer},
        examples=[
            OpenApiExample(
                "Пример запроса",
                value={
                    "name": "Dust II",
                    "link": "https://example.com/dust2",
                    "is_esports_pool": True,
                    "image_link": "<binary>",
                },
                media_type="multipart/form-data",
                request_only=True,
            )
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
    parser_classes = [MultiPartParser, FormParser]

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
    @extend_schema(
        request={
            "multipart/form-data": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "link": {"type": "string"},
                    "is_esports_pool": {"type": "boolean"},
                    "image_link": {"type": "string", "format": "binary"},
                },
            }
        },
        examples=[
            OpenApiExample(
                "Пример обновления",
                value={"name": "Обновленное название", "is_esports_pool": False},
                media_type="multipart/form-data",
            )
        ],
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
    @extend_schema(
        request={
            "multipart/form-data": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "link": {"type": "string"},
                    "is_esports_pool": {"type": "boolean"},
                    "image_link": {"type": "string", "format": "binary"},
                },
            }
        },
        examples=[
            OpenApiExample(
                "Пример обновления",
                value={"name": "Обновленное название", "is_esports_pool": False},
                media_type="multipart/form-data",
            )
        ],
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
