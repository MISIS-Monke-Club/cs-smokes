FROM python:3.13-alpine3.20

WORKDIR /backend

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt /backend/production-requirements.txt
COPY . /backend
EXPOSE 8000

RUN apk update && apk add --no-cache postgresql-client build-base postgresql-dev
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r production-requirements.txt

RUN adduser --disabled-password service-user
USER service-user

CMD ["sh", "-c", "python manage.py runserver 0.0.0.0:8000 --noreload"]