from django.db import migrations
from auth_app.serializers import UserRegistrationSerializer


def create_mock_users(apps, schema_editor):
    User = apps.get_model("auth_app", "User")

    mock_users = [
        {
            "username": "admin",
            "email": "admin@example.com",
            "first_name": "Admin",
            "last_name": "Super",
            "password": "CrutoiTestPass123",
        },
        {
            "username": "test_user",
            "email": "user@example.ru",
            "first_name": "John",
            "last_name": "Doe",
            "password": "Nekrutoipass123",
        },
    ]

    for user_data in mock_users:
        user_serializer = serializer = UserRegistrationSerializer(data=user_data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()


class Migration(migrations.Migration):

    dependencies = [
        ("auth_app", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_mock_users),
    ]
