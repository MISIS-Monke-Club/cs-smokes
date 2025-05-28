from drf_spectacular.utils import (
    extend_schema,
    OpenApiExample,
    OpenApiTypes,
    OpenApiParameter,
)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Lineup
from grenade_class.models import GrenadeClass
from .serializers import LineupSerializer
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from django.core.cache import cache
from .filters import LineupFilter
from django_filters.rest_framework import DjangoFilterBackend
import hashlib
from urllib.parse import urlencode
from rest_framework.parsers import MultiPartParser, FormParser
from .mixins import IsFavoriteMixin


class LineupViews(APIView, IsFavoriteMixin):

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        summary="Получить список всех гранат (Lineup)",
        parameters=[
            OpenApiParameter(
                name="is_approved",
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                description="Фильтр по статусу одобрения (true/false)",
            ),
            OpenApiParameter(
                name="ordering",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Поле для сортировки. "date_of_creation" или "by_alphabet", "-" для обратного порядка',
            ),
            OpenApiParameter(
                name="query",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description="Поиск по названию и описанию гранаты (title, description)",
            ),
        ],
        responses={200: LineupSerializer(many=True)},
        tags=["Lineup"],
    )
    def get(self, request):
        query_string = urlencode(sorted(request.query_params.items()))
        query_hash = hashlib.sha256(query_string.encode()).hexdigest()
        cache_key = f"grenade_list_{query_hash}"

        cached_data = cache.get(cache_key)
        if cached_data is not None:
            annotated_data = self.annotate_is_favorite(cached_data, request.user)
            return Response(annotated_data, status=status.HTTP_200_OK)

        queryset = Lineup.objects.all()
        filterset = LineupFilter(request.GET, queryset=queryset)

        if not filterset.is_valid():
            return Response(filterset.errors, status=status.HTTP_400_BAD_REQUEST)

        lineups = filterset.qs
        serializer = LineupSerializer(lineups, many=True, context={"request": request})

        cache.set(cache_key, serializer.data, timeout=60 * 15)

        annotated_data = self.annotate_is_favorite(serializer.data, request.user)
        return Response(annotated_data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Создать новую гранату (Lineup)",
        request={
            "multipart/form-data": {
                "type": "object",
                "properties": {
                    "map_id": {"type": "integer", "example": 1},
                    "link_to_video": {
                        "type": "string",
                        "example": "https://example.com/video",
                    },
                    "user_id": {"type": "integer", "example": 12},
                    "title": {"type": "string", "example": "Smoke на A"},
                    "description": {
                        "type": "string",
                        "example": "Точная раскидка на плент A",
                    },
                    "is_approved": {"type": "boolean", "example": False},
                    "views": {"type": "integer", "example": 0},
                    "preview_image_link": {
                        "type": "string",
                        "format": "binary",
                    },
                    "grenade_class_id": {"type": "integer", "example": 2},
                },
                "required": ["map_id", "title", "grenade_class_id", "user_id"],
            }
        },
        responses={201: LineupSerializer, 400: LineupSerializer},
        examples=[
            OpenApiExample(
                "Пример запроса",
                value={
                    "map_id": 1,
                    "link_to_video": "https://example.com/video",
                    "user_id": 12,
                    "title": "Smoke на A",
                    "description": "Точная раскидка на плент A",
                    "is_approved": False,
                    "views": 0,
                    "preview_image_link": "<binary>",
                    "grenade_class_id": 2,
                },
                media_type="multipart/form-data",
                request_only=True,
            ),
        ],
        tags=["Lineup"],
    )
    def post(self, request):
        serializer = LineupSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            cache.delete("grenade_list")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LineupRUDViews(APIView, IsFavoriteMixin):

    permission_classes = [IsAuthenticated]

    @extend_schema(
        description="Получить детальную информацию о раскидке",
        summary="Получить детальную информацию о раскидке по ID",
        responses={
            200: LineupSerializer,
            404: None,
        },
        tags=["Lineup"],
    )
    def get(self, request, pk):
        cache_key = f"grenade_detail_{pk}"
        cached_data = cache.get(cache_key)

        if cached_data is not None:
            annotated_data = self.annotate_is_favorite(cached_data, request.user)
            return Response(annotated_data)
        obj = get_object_or_404(Lineup, pk=pk)
        serializer = LineupSerializer(obj, context={"request": request})
        cache.set(cache_key, serializer.data, timeout=60 * 15)
        annotated_data = self.annotate_is_favorite(serializer.data, request.user)
        return Response(annotated_data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Обновить Lineup (полностью)",
        request=LineupSerializer,
        responses={200: LineupSerializer, 400: LineupSerializer, 404: LineupSerializer},
        examples=[
            OpenApiExample(
                "Ошибка валидации",
                value={"title": ["Это поле обязательно."]},
                response_only=True,
                status_codes=["400"],
            )
        ],
        tags=["Lineup"],
    )
    def put(self, request, pk):
        obj = get_object_or_404(Lineup, pk=pk)
        serializer = LineupSerializer(obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            cache.delete(f"grenade_detail_{pk}")
            cache.delete("grenade_list")
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Частичное обновление Lineup",
        request=LineupSerializer,
        responses={200: LineupSerializer, 400: LineupSerializer, 404: LineupSerializer},
        examples=[
            OpenApiExample(
                "Ошибка валидации (description)",
                value={"description": ["Это поле не может быть пустым."]},
                response_only=True,
                status_codes=["400"],
            )
        ],
        tags=["Lineup"],
    )
    def patch(self, request, pk):
        obj = get_object_or_404(Lineup, pk=pk)
        serializer = LineupSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            cache.delete(f"grenade_detail_{pk}")
            cache.delete("grenade_list")
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Удалить Lineup",
        responses={204: None, 404: LineupSerializer},
        examples=[
            OpenApiExample(
                "Успешное удаление", value={}, response_only=True, status_codes=["204"]
            )
        ],
        tags=["Lineup"],
    )
    def delete(self, request, pk):
        obj = get_object_or_404(Lineup, pk=pk)
        obj.delete()
        cache.delete(f"grenade_detail_{pk}")
        cache.delete("grenade_list")
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChangeGrenadeClassView(APIView):

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Изменить grenade_class у Lineup",
        request={
            "application/json": {
                "type": "object",
                "properties": {
                    "grenade_class_id": {
                        "type": "integer",
                        "example": 2,
                        "description": "ID нового GrenadeClass",
                    }
                },
                "required": ["grenade_class"],
            }
        },
        responses={
            200: OpenApiTypes.OBJECT,
            400: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT,
        },
        tags=["Lineup"],
    )
    def patch(self, request, pk):
        lineup = get_object_or_404(Lineup, pk=pk)
        grenade_class_id = request.data.get("grenade_class_id")

        if not grenade_class_id:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        try:
            grenade_class = GrenadeClass.objects.get(pk=grenade_class_id)
        except GrenadeClass.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        lineup.grenade_class_id = grenade_class
        lineup.save()
        cache.delete(f"grenade_detail_{pk}")
        cache.delete("grenade_list")
        return Response(status=status.HTTP_200_OK)


class LineupViewFilters(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Получить доступные фильтры для Lineup",
        responses={200: OpenApiTypes.OBJECT},
        tags=["Lineup"],
    )
    def get(self, request):
        filters = {
            "is_approved": ["true", "false"],
        }

        cache_key = f"lineup_filters_detail"
        cached_data = cache.get(cache_key)

        if cached_data is not None:
            return Response(cached_data)
        cache.set(cache_key, filters, timeout=60 * 60)
        return Response(filters, status=status.HTTP_200_OK)


class LineupViewSorts(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Получить доступные сортировки для Lineup",
        responses={200: OpenApiTypes.OBJECT},
        tags=["Lineup"],
    )
    def get(self, request):
        cache_key = f"lineup_sorts_detail"
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)
        sorts = {
            "ordering": [
                "date_of_creation",
                "-date_of_creation",
                "by_alphabet",
                "-by_alphabet",
            ]
        }
        cache.set(cache_key, sorts, timeout=60 * 60)
        return Response(sorts, status=status.HTTP_200_OK)
