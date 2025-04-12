from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from auth_app.models import Map
from auth_app.serializers import MapSerializer
from drf_spectacular.utils import extend_schema, OpenApiExample
from rest_framework.permissions import IsAuthenticated, AllowAny


class MapsView(APIView):
    # def get_permissions(self):
    #     if self.request.method == "POST":
    #         return [IsAuthenticated()]
    #     return [AllowAny()]

    @extend_schema(
        description="Получить список всех карт",
        responses={200: MapSerializer(many=True)},
    )
    def get(self, request):
        maps = Map.objects.all()
        serializer = MapSerializer(maps, many=True)
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
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MapDetailRUDView(APIView):
    # def get_permissions(self):
    #     if self.request.method == "GET":
    #         return [AllowAny()]
    #     return [IsAuthenticated()]

    @extend_schema(
        description="Получить детальную информацию о карте",
        responses={
            200: MapSerializer,
            404: None,
        },
    )
    def get(self, request, pk):
        map_obj = get_object_or_404(Map, pk=pk)
        serializer = MapSerializer(map_obj)
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
        return Response(status=status.HTTP_204_NO_CONTENT)
