from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from auth_app.models import Favorites
from auth_app.serializers import FavoritesSerializer, FavoritesCreateSerializer
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes


class FavoritesAddView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=FavoritesCreateSerializer,
        responses={201: FavoritesSerializer, 400: OpenApiTypes.OBJECT},
        description="Добавление гранаты в избранное",
        examples=[
            OpenApiExample(
                "Пример запроса",
                value={"grenade_id": 123},
                request_only=True,
            ),
            OpenApiExample(
                "Пример ответа",
                value={
                    "id": 1,
                    "user_id": {
                        "id": 5,
                        "username": "example_user",
                        # другие поля
                    },
                    "grenade_id": {
                        "id": 123,
                        "title": "Smoke Jungle",
                        # другие поля Lineup
                    },
                },
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
            return Response(FavoritesSerializer(favorite).data, status=201)
        return Response(serializer.errors, status=400)


class FavoritesView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="id",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description="ID гранаты или пользователя",
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
            200: FavoritesSerializer(many=True),
            400: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT,
        },
        description="Получение списка избранных гранат пользователя",
        examples=[
            OpenApiExample(
                "Example response",
                value=[
                    {
                        "id": 1,
                        "user": 1,
                        "grenade": {
                            "grenade_id": "123",
                            # другие поля Lineup
                        },
                    }
                ],
                response_only=True,
            )
        ],
    )
    def get(self, request, pk=None):
        if not pk:
            return Response({"error": "Не указан user_id"}, status=400)
        favorites = Favorites.objects.filter(user_id=pk)
        if not favorites.exists():
            return Response(
                {
                    "message": "The user has no grenades in their favorites.",
                    "user_id": pk,
                },
                status=200,
            )
        serializer = FavoritesSerializer(favorites, many=True)
        return Response(serializer.data, status=200)
