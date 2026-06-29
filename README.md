# 📌 **cs-smokes**  
**Описание:**  
Цель нашего проекта — создать удобную платформу для просмотра раскидок (лайнапов) на популярных картах из пулов Valve и Faceit для игры **CS2**.

---

## ✨ **Участники проекта:**

- **Backend:**
  - 🖥️ Батуров Даниил  
  - 🖥️ Борисенко Павел  

- **Frontend:**
  - 🎨 Аверин Артемий  
  - 🎨 Дарьютин Даниил  

---

## 🚀 **Функционал**

- Платформа доступна через **Telegram Web App** или **веб-сайт**.
- **Просмотр раскидок** на картах с удобными фильтрами:
  - 🟢 Вид гранаты (smoke, flash, molotov и другие)
  - 🔥 Моментальный лайнап или нет
  - 🔍 И множество других фильтров
- Возможность просмотра **коротких видео**, показывающих как и куда кидать гранаты.
- **3D/2D визуализация карт**, где указаны точки, с которых осуществляется бросок гранаты, в точности как в игре.  

---

## 📂 **Структура проекта**
/cs-smokes <br>
├── backend/                - серверная часть приложения <br>
├── frontend/               - клиент приложения <br>
├── bot                     - телеграмм бот <br>
├── docker-compose.yaml     - конфигурация docker compose <br>
└── README.md               - описание проект

---

## 📦 **Установка и запуск приложения**

Для запуска проекта локально выполните следующие шаги:

1. Клонируйте репозиторий:
  ```bash
  $ git clone https://github.com/Russian-Gamedev-Arrising/cs-smokes.git
  ```

2. Перейдите в директорию приложения:
  ```bash
  $ cd cs-smokes
  ```

3. Проверьте наличие Docker на своем компьютере и [установите](https://docs.docker.com/engine/install/) его, если потребуется
```bash
$ docker -v 
```

4. Запустите приложение с использованием Docker:
```bash
$ docker compose up -d --build
```

5. Наслаждайтесь современным решением в сфере гейминга
- [ссылка на локальный фронтенд](http://localhost:8080/)
- [ссылка на локальный бекенд](http://localhost:3000/)

### Go backend deployment notes

- Public app: `http://localhost:8000`, admin app: `http://localhost:8001`,
  backend API: `http://localhost:3000/api`, OpenAPI docs: `/api/docs`.
- Production compose serves the Telegram frontend through nginx `/`, the admin
  frontend through `/admin/`, Go API through `/api/`, WebSockets through
  `/ws/api/`, and media through `/media/`.
- Keep `WRITE_GATE=true` until migration verification, golden contract diff,
  WebSocket log redaction probe, and smoke checks pass.
- Cutover and rollback runbooks live under `docs/release/`.

---

## 💬 **Контакты**

- 🐙 **GitHub:** [Репозиторий проекта](https://github.com/Russian-Gamedev-Arrising/cs-smokes)  
- 🌐 **Web App:** [Перейти на сайт](https://cs-smokes.com)  

---

## 🎮 **Поддержка и вклад**

Если хотите внести свой вклад в проект или помочь с его улучшением, не стесняйтесь отправлять разные гранаты на наши контакты: @dewi_x0 (tg). Ваши идеи и предложения всегда приветствуются!
