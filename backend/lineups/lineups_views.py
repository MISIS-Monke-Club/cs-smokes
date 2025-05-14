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


class LineupViews(APIView):

    permission_classes = [IsAuthenticated]

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
        ],
        responses={200: LineupSerializer(many=True)},
        tags=["Lineup"],
    )
    def get(self, request):

        cache_key = "grenade_list"
        cached_data = cache.get(cache_key)

        if cached_data is not None:
            return Response(cached_data, status=status.HTTP_200_OK)

        lineups = Lineup.objects.all()
        is_approved = request.query_params.get("is_approved")
        if is_approved is not None:
            if is_approved.lower() == "true":
                lineups = lineups.filter(is_approved=True)
            elif is_approved.lower() == "false":
                lineups = lineups.filter(is_approved=False)

        ordering = request.query_params.get("ordering")
        if ordering:
            if ordering.lstrip("-") == "date_of_creation":
                ordering_field = "created_at"
            elif ordering.lstrip("-") == "by_alphabet":
                ordering_field = "title"
            else:
                ordering_field = None

            if ordering_field:
                if ordering.startswith("-"):
                    ordering_field = "-" + ordering_field
                lineups = lineups.order_by(ordering_field)
        serializer = LineupSerializer(lineups, many=True, context={"request": request})

        cache.set(cache_key, serializer.data, timeout=60 * 15)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Создать новую гранату (Lineup)",
        request=LineupSerializer,
        responses={201: LineupSerializer, 400: LineupSerializer},
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
    def post(self, request):
        serializer = LineupSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            cache.delete("grenade_list")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LineupRUDViews(APIView):

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
            return Response(cached_data)
        obj = get_object_or_404(Lineup, pk=pk)
        serializer = LineupSerializer(obj, context={"request": request})
        cache.set(cache_key, serializer.data, timeout=60 * 15)
        return Response(serializer.data)

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
