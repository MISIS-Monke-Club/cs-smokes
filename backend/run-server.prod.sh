pip install --no-cache-dir -r production_requirements.txt
echo "Создание новых миграций"
python manage.py makemigrations
echo "Применение миграций"
python manage.py migrate
echo "Сбор статики"
python manage.py collectstatic --noinput

echo "Создание суперпользователя"
python manage.py shell <<EOF
import os
from dotenv import load_dotenv
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.db.utils import IntegrityError

load_dotenv()


SUPER_USER_NAME = os.getenv('SUPER_USER_NAME')
SUPER_USER_EMAIL = os.getenv('SUPER_USER_EMAIL')
SUPER_USER_PASSWORD = os.getenv('SUPER_USER_PASSWORD')

User = get_user_model()
try:
    user = User.objects.create_superuser(SUPER_USER_NAME, SUPER_USER_EMAIL, SUPER_USER_PASSWORD)
    print('Суперпользователь создан успешно.')
except IntegrityError:
    print('Суперпользователь уже существует.')

EOF

echo "Запуск ASGI-сервера через uvicorn"
uvicorn backend.asgi:application --host 0.0.0.0 --port 8000 --reload