import hashlib
import hmac
import json
import os
import urllib.parse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import User as CustomUser
from auth_app.serializers import UserSerializer

# Получаем токен из переменной окружения
TELEGRAM_BOT_TOKEN = os.getenv("TOKEN")


class TelegramAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        initData = request.data.get("initData")  # данные из Telegram Web App
        if not initData:
            return Response({"error": "initData is required"}, status=400)

        # Логирование полученного initData
        print(f"Received initData: {initData}")

        # Проверка подписи
        if not self.check_webapp_signature(TELEGRAM_BOT_TOKEN, initData):
            return Response(
                {"error": "Invalid hash. Data has been tampered with."}, status=400
            )

        # Разбираем параметры initData
        params = dict(urllib.parse.parse_qsl(initData))

        # Логирование параметров
        print(f"Parsed parameters: {params}")

        # Декодируем параметр 'user', чтобы избежать экранированных символов
        user_data = urllib.parse.unquote(params.get("user"))
        params["user"] = user_data  # Обновляем параметр 'user' в params

        # Логирование декодированных данных пользователя
        print(f"Decoded user data: {user_data}")

        # Декодирование данных из user
        try:
            user_data = json.loads(user_data)  # Декодируем user как JSON
        except json.JSONDecodeError:
            return Response({"error": "Invalid user data"}, status=400)

        # Логирование данных пользователя
        print(f"User data: {user_data}")

        tg_id = user_data.get("id")
        username = user_data.get("username")
        first_name = user_data.get("first_name")
        last_name = user_data.get("last_name")
        avatar_url = user_data.get("photo_url")

        # Создание или получение пользователя
        user, created = CustomUser.objects.get_or_create(
            tg_id=tg_id,
            defaults={
                "username": username,
                "first_name": first_name,
                "last_name": last_name,
                "avatar_url": avatar_url,
            },
        )

        serializer = UserSerializer(user)

        # Получение JWT токенов
        from rest_framework_simplejwt.tokens import RefreshToken

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        return Response(
            {
                "user": serializer.data,
                "access_token": access_token,
                "refresh_token": str(refresh),
            }
        )

    def check_webapp_signature(self, token: str, initData: str) -> bool:
        """
        Check incoming WebApp init data signature

        Source: https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app

        :param token:
        :param initData:
        :return:
        """
        try:
            parsed_data = dict(urllib.parse.parse_qsl(initData))
        except ValueError:
            # Init data is not a valid query string
            return False
        if "hash" not in parsed_data:
            # Hash is not present in init data
            return False

        hash_ = parsed_data.pop("hash")
        data_check_string = "\n".join(
            f"{k}={v}" for k, v in sorted(parsed_data.items())
        )
        secret_key = hmac.new(
            key=b"WebAppData", msg=token.encode(), digestmod=hashlib.sha256
        )
        calculated_hash = hmac.new(
            key=secret_key.digest(),
            msg=data_check_string.encode(),
            digestmod=hashlib.sha256,
        ).hexdigest()
        return calculated_hash == hash_
