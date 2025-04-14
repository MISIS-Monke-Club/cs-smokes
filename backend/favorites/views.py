from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from auth_app.models import Favorites, Lineup, User
from auth_app.serializers import FavoritesSerializer


class FavoritesView(APIView):
    def get_permissions(self):
        if self.request.method in ["GET"]:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, userId=None):
        if userId:
            user = get_object_or_404(User, id=userId)
            favorites = Favorites.objects.filter(user=user)
            serializer = FavoritesSerializer(favorites, many=True)
            return Response(serializer.data)
        return Response(
            {"error": "Не указан user_id"}, status=status.HTTP_400_BAD_REQUEST
        )

    def post(self, request):
        grenade_id = request.data.get("grenade_id")
        if not grenade_id:
            return Response(
                {"error": "Требуется grenade_id"}, status=status.HTTP_400_BAD_REQUEST
            )

        lineup = get_object_or_404(Lineup, id=grenade_id)
        if Favorites.objects.filter(user=request.user, grenade=lineup).exists():
            return Response(
                {"error": "Уже в избранном"}, status=status.HTTP_400_BAD_REQUEST
            )

        favorite = Favorites.objects.create(user=request.user, grenade=lineup)
        serializer = FavoritesSerializer(favorite)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request, grenadeId=None):
        if not grenadeId:
            return Response(
                {"error": "Не указан grenade_id"}, status=status.HTTP_400_BAD_REQUEST
            )

        favorite = get_object_or_404(Favorites, grenade_id=grenadeId, user=request.user)
        favorite.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
