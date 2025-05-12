from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Property
from .serializers import PropertySerializer
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, OpenApiExample
from rest_framework.permissions import IsAuthenticated


class PropertyViews(APIView):

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Получить все свойства",
        responses=PropertySerializer(many=True),
    )
    def get(self, request):
        properties = Property.objects.all()
        serializer = PropertySerializer(properties, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Создать новое свойство",
        request=PropertySerializer,
        responses=PropertySerializer,
        examples=[
            OpenApiExample(
                "Пример свойства",
                value={"name": "Пример имени"},
                request_only=True,
            ),
        ],
    )
    def post(self, request):
        serializer = PropertySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProperyViewsRUD(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        description="Получить детальную информацию о свойстве",
        summary="Получить детальную информацию о свойстве по ID",
        responses={
            200: PropertySerializer,
            404: None,
        },
    )
    def get(self, request, pk):
        obj = get_object_or_404(Property, pk=pk)
        serializer = PropertySerializer(obj)
        return Response(serializer.data)

    @extend_schema(
        summary="Обновить свойство (полностью)",
        request=PropertySerializer,
        responses=PropertySerializer,
    )
    def put(self, request, pk):
        obj = get_object_or_404(Property, pk=pk)
        serializer = PropertySerializer(obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Обновить свойство (частично)",
        request=PropertySerializer,
        responses=PropertySerializer,
    )
    def patch(self, request, pk):
        obj = get_object_or_404(Property, pk=pk)
        serializer = PropertySerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        summary="Удалить свойство",
        responses={204: OpenApiExample("Удалено успешно", value=None)},
    )
    def delete(self, request, pk):
        obj = get_object_or_404(Property, pk=pk)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
