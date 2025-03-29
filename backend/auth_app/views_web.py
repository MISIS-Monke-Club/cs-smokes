from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import UserRegistrationSerializer, LoginSerializer, UserSerializer
from .models import User
from rest_framework.permissions import IsAuthenticated


class RegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer

    def get(self, request):
        return Response(
            {"required_fields": ["username", "email", "password", "password2"]}
        )

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "message": "Пользователь успешно зарегистрирован",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer
