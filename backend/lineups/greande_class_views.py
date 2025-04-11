from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from auth_app.models import GrenadeClass
from auth_app.serializers import GrenadeClassSerializer
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, OpenApiExample
from rest_framework.permissions import IsAuthenticated, AllowAny


class GrenadeClassesView(APIView):

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    @extend_schema(
        description="Получить список всех классов гранат",
        responses={200: GrenadeClassSerializer(many=True)},
    )
    def get(self, request):
        grenade_classes = GrenadeClass.objects.all()
        serializer = GrenadeClassSerializer(grenade_classes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        description="Создать новый класс гранат",
        request=GrenadeClassSerializer,
        responses={
            201: GrenadeClassSerializer,
            400: None,
        },
        examples=[
            OpenApiExample(
                "Пример создания класса гранат",
                value={
                    "name": "Световая граната",
                    "description": "слепит врага",
                    "price": 300,
                },
                request_only=True,
            ),
        ],
    )
    def post(self, request):
        serializer = GrenadeClassSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GrenadeClassRUDVIew(APIView):

    permission_classes = [IsAuthenticated]

    @extend_schema(
        description="Полное обновление класса гранаты",
        request=GrenadeClassSerializer,
        responses={
            200: GrenadeClassSerializer,
            400: None,
            404: None,
        },
    )
    def put(self, request, pk):
        grenade_class_obj = get_object_or_404(GrenadeClass, pk=pk)
        serializer = GrenadeClassSerializer(grenade_class_obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        description="Частичное обновление класса гранаты",
        request=GrenadeClassSerializer,
        responses={
            200: GrenadeClassSerializer,
            400: None,
            404: None,
        },
    )
    def patch(self, request, pk):
        grenade_class_obj = get_object_or_404(GrenadeClass, pk=pk)
        serializer = GrenadeClassSerializer(
            grenade_class_obj, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        description="Удалить класс гранат",
        responses={
            204: None,
            404: None,
        },
    )
    def delete(self, request, pk):
        grenade_class_obj = get_object_or_404(GrenadeClass, pk=pk)
        grenade_class_obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
