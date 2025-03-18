import os
import json
import hashlib
import hmac
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


class TelegramAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        init_data = request.data.get("initData")  # Получаем initData
        bot_token = os.getenv("TOKEN", "token")

        if not init_data or not bot_token:
            return Response(
                {"error": "Invalid data"}, status=status.HTTP_400_BAD_REQUEST
            )

        parsed_data = dict(x.split("=") for x in init_data.split("&") if "=" in x)
        hash_to_check = parsed_data.pop("hash", None)
        sorted_data_string = "\n".join(
            f"{k}={v}" for k, v in sorted(parsed_data.items())
        )

        # Генерация хеша для проверки
        secret_key = hashlib.sha256(bot_token.encode()).digest()
        calculated_hash = hmac.new(
            secret_key, sorted_data_string.encode(), hashlib.sha256
        ).hexdigest()

        if calculated_hash != hash_to_check:
            return Response(
                {"error": "Invalid initData"}, status=status.HTTP_403_FORBIDDEN
            )

        # Получаем данные пользователя из initData
        user_data = json.loads(parsed_data.get("user", "{}"))
        tg_id = user_data.get("id")
        first_name = user_data.get("first_name", "")
        last_name = user_data.get("last_name", "")
        username = user_data.get("username", f"user_{tg_id}")

        if not tg_id:
            return Response(
                {"error": "Invalid Telegram ID"}, status=status.HTTP_400_BAD_REQUEST
            )

        # Получаем или создаем пользователя в базе данных
        user, created = User.objects.get_or_create(
            tg_id=tg_id,
            defaults={
                "username": username,
                "first_name": first_name,
                "last_name": last_name,
            },
        )

        tokens = get_tokens_for_user(user)
        return Response(tokens)
