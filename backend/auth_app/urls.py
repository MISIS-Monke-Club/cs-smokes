from django.urls import re_path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from auth_app.views import (
    TelegramAuthView,
)
from auth_app.views_web import (
    RegistrationView,
    LoginView,
)

urlpatterns = [
    # Основные auth endpoints
    re_path(r"^login/?$", LoginView.as_view(), name="user_login"),
    re_path(r"^login/tg/?$", TelegramAuthView.as_view(), name="telegram_login"),
    re_path(r"^register/?$", RegistrationView.as_view(), name="user_register"),
    # JWT endpoints
    re_path(r"^token/?$", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    re_path(r"^token/refresh/?$", TokenRefreshView.as_view(), name="token_refresh"),
]
