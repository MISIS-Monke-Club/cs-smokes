FROM python:3.13-alpine3.20

WORKDIR /app

COPY requirements_bot.txt .

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements_bot.txt

COPY . .
CMD ["python", "bot.py"]