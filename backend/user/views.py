from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from auth_app.models import User
from auth_app.serializers import (
    UserSerializer,
    UserRegistrationSerializer,
)


class UserListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Получить список пользователей",
        description="Возвращает список всех пользователей с полной информацией",
        responses={200: UserSerializer(many=True), 401: OpenApiTypes.OBJECT},
        examples=[
            OpenApiExample(
                "Пример успешного ответа",
                value={
                    "user_id": 1,
                    "username": "usename",
                    "email": "user@example.com",
                    "first_name": "",
                    "last_name": "",
                    "avatar_url": "",
                    "steam_link": "",
                    "tg_id": None,
                    "is_banned": False,
                },
                response_only=True,
                status_codes=["200"],
            ),
        ],
    )
    def get(self, request):
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Создать нового пользователя",
        description="Создает нового пользователя с указанными данными",
        request=UserRegistrationSerializer,
        responses={
            201: UserSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
        },
        examples=[
            OpenApiExample(
                "Пример запроса",
                value={
                    "username": "new_user",
                    "email": "new_user@example.com",
                    "password": "new_user_password",
                },
                request_only=True,
            ),
        ],
    )
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, id):
        return get_object_or_404(User, user_id=id)

    @extend_schema(
        summary="Получить пользователя по ID",
        description="Возвращает полные данные пользователя",
        parameters=[
            OpenApiParameter(
                name="id",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description="ID пользователя",
            )
        ],
        responses={
            200: UserSerializer,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT,
        },
    )
    def get(self, request, id):
        user = self.get_object(id)
        serializer = UserSerializer(user)
        return Response(serializer.data)

    @extend_schema(
        summary="Полное обновление пользователя",
        description="Обновляет все поля пользователя",
        request=UserSerializer,
        parameters=[
            OpenApiParameter(
                name="id",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description="ID пользователя",
            )
        ],
        responses={
            200: UserSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT,
        },
    )
    def put(self, request, id):
        user = self.get_object(id)
        serializer = UserSerializer(user, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Частичное обновление пользователя",
        description="Обновляет указанные поля пользователя",
        request=UserSerializer,
        parameters=[
            OpenApiParameter(
                name="id",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description="ID пользователя",
            )
        ],
        responses={
            200: UserSerializer,
            400: OpenApiTypes.OBJECT,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT,
        },
    )
    def patch(self, request, id):
        user = self.get_object(id)
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Удалить пользователя",
        description="Удаляет пользователя по ID",
        parameters=[
            OpenApiParameter(
                name="id",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description="ID пользователя",
            )
        ],
        responses={
            204: OpenApiTypes.NONE,
            401: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT,
        },
    )
    def delete(self, request, id):
        user = self.get_object(id)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
