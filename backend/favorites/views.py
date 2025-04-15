from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from auth_app.models import Favorites, Lineup
from auth_app.serializers import FavoritesSerializer


# class MixedPermissionAPIView(APIView):
#     def get_permissions(self):
#         if self.request.method == "GET":
#             return [AllowAny()]
#         return [IsAuthenticated()]]


class FavoritesAddView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        grenade_id = request.data.get("grenade_id")
        if not grenade_id:
            return Response({"error": "Укажи grenade_id"}, status=400)
        lineup = get_object_or_404(Lineup, grenade_id=grenade_id)
        if Favorites.objects.filter(user=request.user, grenade=lineup).exists():
            return Response({"error": "Уже в избранном"}, status=400)
        favorite = Favorites.objects.create(user=request.user, grenade=lineup)
        serializer = FavoritesSerializer(favorite)
        return Response(serializer.data, status=201)


class FavoritesView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk=None):
        if not pk:
            return Response({"error": "Не указан grenade_id"}, status=400)
        favorite = get_object_or_404(Favorites, grenade_id=pk, user_id=request.user)
        favorite.delete()
        return Response(status=204)

    def get(self, request, pk=None):
        if not pk:
            return Response({"error": "Не указан user_id"}, status=400)
        favorites = Favorites.objects.filter(user_id=pk)
        if not favorites.exists():
            return Response(
                {"message": "У пользователя нет гранат в избранном", "user_id": pk},
                status=200,
            )
        serializer = FavoritesSerializer(favorites, many=True)
        return Response(serializer.data, status=200)
