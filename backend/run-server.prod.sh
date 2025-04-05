pip install --no-cache-dir -r production_requirements.txt
echo "Создание новых миграций"
python manage.py makemigrations
echo "Применение миграций"
python manage.py migrate
python manage.py runserver 0.0.0.0:8000