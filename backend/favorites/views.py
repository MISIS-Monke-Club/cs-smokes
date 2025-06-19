from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Favorites
from .serializers import FavoritesCreateSerializer
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from lineups.serializers import LineupSerializer
from maps.mixixns import LineupStatusFavoriteMixin
from lineups.mixins import IsFavoriteMixin, LineupStatusMixin


class FavoritesAddView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=FavoritesCreateSerializer,
        responses={201: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT},
        description="Добавление гранаты в избранное",
        examples=[
            OpenApiExample(
                "Пример запроса",
                value={"grenade_id": 123},
                request_only=True,
            ),
            OpenApiExample(
                "Пример ответа",
                value={"user_id": 1, "grenade_id": 2},
                response_only=True,
            ),
        ],
    )
    def post(self, request):
        serializer = FavoritesCreateSerializer(
            data=request.data, context={"request": request}
        )

        if serializer.is_valid():
            favorite = serializer.save()

            return Response(
                {"user_id": favorite.user_id.pk, "grenade_id": favorite.grenade_id.pk},
                status=201,
            )

        return Response(serializer.errors, status=400)


class FavoritesView(
    APIView, IsFavoriteMixin, LineupStatusFavoriteMixin, LineupStatusMixin
):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="id",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description="ID гранаты пользователя, которую хотим удалить из избранного",
            )
        ],
        responses={204: None, 400: OpenApiTypes.OBJECT, 404: OpenApiTypes.OBJECT},
        description="Удаление гранаты из избранного",
    )
    def delete(self, request, pk=None):
        favorite = get_object_or_404(Favorites, grenade_id=pk, user_id=request.user)
        favorite.delete()
        return Response(status=204)

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="id",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description="ID пользователя для получения его избранных гранат",
            )
        ],
        responses={
            200: LineupSerializer(many=True),
            400: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT,
        },
        description="Получение списка избранных гранат пользователя",
        examples=[
            OpenApiExample(
                "Пример ответа",
                value=[
                    {
                        "grenade_id": 123,
                        "map_id": 1,
                        "link_to_video": "https://example.com/video",
                        "user_id": 5,
                        "created_at": "2025-05-05T06:32:03.493Z",
                        "title": "Smoke Jungle",
                        "description": "Бросок с точки A на джангл",
                        "is_approved": True,
                        "is_favorite": True,
                        "views": 42,
                        "preview_image_link": "https://example.com/image.jpg",
                        "grenade_class_id": 2,
                        "grenade_class": {
                            "grenade_class_id": 2,
                            "name": "Smoke",
                            "description": "дымовая граната",
                            "price": 300,
                        },
                        "property_list": [
                            {"name": "Откуда кидать", "value": "Угол стены"}
                        ],
                        "status": "WAITING FOR CREATION",
                    }
                ],
                response_only=True,
            )
        ],
    )
    def get(self, request, pk=None):
        if not pk:
            return Response({"error": "Не указан user_id"}, status=400)

        favorites = Favorites.objects.filter(user_id=pk).select_related("grenade_id")

        if not favorites.exists():
            return Response([], status=200)

        lineups = [fav.grenade_id for fav in favorites]
        serializer = LineupSerializer(lineups, many=True, context={"request": request})
        enriched_data = self.add_status_and_favorite(serializer.data, request)
        return Response(enriched_data, status=200)
