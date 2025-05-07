import hashlib
import hmac
import json
import os
import urllib.parse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import User as CustomUser
from .serializers import UserSerializer
from drf_spectacular.utils import extend_schema
from drf_spectacular.utils import extend_schema, OpenApiExample, OpenApiResponse


# Получаем токен из переменной окружения
TELEGRAM_BOT_TOKEN = os.getenv("TOKEN")


@extend_schema(
    tags=["Auth"],
    request={
        "application/json": {
            "example": {
                "init_data": "query_id=AAHdF6JSAAAAAN0XohWB&user=%7B%22id%22%3A123456%7D&hash=..."
            }
        }
    },
    responses={
        200: OpenApiResponse(
            description="Успешная аутентификация",
            examples=[
                OpenApiExample(
                    "Пример ответа",
                    value={
                        "user": {
                            "id": 1,
                            "username": "john_doe",
                            "tg_id": 123456789,
                        },
                        "access_token": "eyJhbGciOi...",
                        "refresh_token": "eyJhbGciOi...",
                    },
                )
            ],
        ),
        400: OpenApiResponse(
            description="Ошибки валидации",
            examples=[
                OpenApiExample(
                    "Неверные данные",
                    value={"error": "Invalid hash. Data has been tampered with."},
                ),
                OpenApiExample(
                    "Отсутствует init_data", value={"error": "init_data is required"}
                ),
            ],
        ),
    },
)
@extend_schema(tags=["Auth"])
class TelegramAuthView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        examples=[
            OpenApiExample(
                "Пример запроса",
                value={
                    "init_data": "query_id=AAHdF6JSAAAAAN0XohWB&user=%7B%22id%22%3A123456%7D&hash=..."
                },
                request_only=True,
            )
        ]
    )
    def post(self, request):
        init_data = request.data.get("init_data")  # данные из Telegram Web App
        if not init_data:
            return Response({"error": "init_data is required"}, status=400)

        # Логирование полученного init_data
        print(f"Received init_data: {init_data}")

        # Проверка подписи
        if not self.check_webapp_signature(TELEGRAM_BOT_TOKEN, init_data):
            return Response(
                {"error": "Invalid hash. Data has been tampered with."}, status=400
            )

        # Разбираем параметры init_data
        params = dict(urllib.parse.parse_qsl(init_data))

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

    def check_webapp_signature(self, token: str, init_data: str) -> bool:
        """
        Check incoming WebApp init data signature

        Source: https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app

        :param token:
        :param init_data:
        :return:
        """
        try:
            parsed_data = dict(urllib.parse.parse_qsl(init_data))
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
