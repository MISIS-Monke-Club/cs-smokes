from drf_spectacular.utils import extend_schema, OpenApiExample
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from auth_app.models import Lineup
from auth_app.serializers import LineupSerializer
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated, AllowAny


class LineupViews(APIView):

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    @extend_schema(
        summary="Получить список всех гранат (Lineup)",
        responses={200: LineupSerializer(many=True)},
        tags=["Lineup"],
    )
    def get(self, request):
        lineups = Lineup.objects.all()
        serializer = LineupSerializer(lineups, many=True)
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
        serializer = LineupSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
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
        obj = get_object_or_404(Lineup, pk=pk)
        serializer = LineupSerializer(obj)
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
        return Response(status=status.HTTP_204_NO_CONTENT)
