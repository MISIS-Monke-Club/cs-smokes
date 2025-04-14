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
            "password": "IDINAXUI123IDINAXUI123IDINAXUI",
        },
        {
            "username": "test_user",
            "email": "user@example.com",
            "first_name": "John",
            "last_name": "Doe",
            "password": "IDINAXUI123IDINAXUI123IDINAXUI",
        },
    ]

    for user_data in mock_users:
        user_serializer = serializer = UserRegistrationSerializer(data=user_data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()


class Migration(migrations.Migration):

    dependencies = [
        ("auth_app", "0005_alter_user_tg_id"),
    ]

    operations = [
        migrations.RunPython(create_mock_users),
    ]
