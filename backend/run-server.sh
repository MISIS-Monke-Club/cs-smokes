pip install --no-cache-dir -r requirements.txt
echo "Создание новых миграций"
python manage.py makemigrations
echo "Применение миграций"
python manage.py migrate
echo "Запуск ASGI-сервера через uvicorn"
uvicorn backend.asgi:application --host 0.0.0.0 --port 8000 --reload