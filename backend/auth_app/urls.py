from django.contrib import admin
from django.urls import path
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
    path("login/", LoginView.as_view(), name="user_login"),
    path("login/tg/", TelegramAuthView.as_view(), name="telegram_login"),
    path("register/", RegistrationView.as_view(), name="user_register"),
    # JWT endpoints
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]
