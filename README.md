# ReStore — Каталог игр с отзывами

> Аналог Letterboxd для видеоигр. Каталог с рейтингами IMDB, пользовательскими отзывами и профилями.

🔗 **[Живой сайт](https://re-store-beta.vercel.app/)**

---

## О проекте

ReStore — это платформа для любителей игр, где можно:

- Смотреть информацию об играх с рейтингом IMDB и средним рейтингом сайта
- Оставлять отзывы с оценками и фото
- Добавлять игры в избранное
- Вести профиль с историей оценок и избранного
- Фильтровать и искать игры по жанру, платформе, дате, рейтингу

---

## Стек

**Backend**

- Python, FastAPI, SQLAlchemy (async), Alembic
- PostgreSQL
- JWT-аутентификация
- Docker, Docker Compose
- Pytest

**Frontend**

- React, Vite (деплой на Vercel)

**Инфраструктура**

- Backend + БД: Render
- Frontend: Vercel

---

## Функциональность

### Пользователи

- Регистрация и вход по нику или email
- Валидация email через `EmailStr`
- JWT-токен в браузере
- Смена ника и пароля в профиле
- Профиль с историей оценок и избранным

### Отзывы

- Создание отзывов с оценкой и фото
- Лимиты на количество отзывов и загрузку изображений
- Средний рейтинг игры считается автоматически

### Премиум

- Баннер профиля
- Цветовые темы оформления сайта
- Значок Premium в профиле

### Админка

- Создание игр, жанров, платформ
- Бан пользователей (постоянный и временный)
- Удаление пользователей

### Поиск и фильтрация

- Поиск по названию с автоподсказками
- Фильтрация по рейтингу, жанру, платформе, дате
- Поддержка алиасов и псевдонимов

---

## Запуск локально

### Требования

- **Docker** и Docker Compose — для полного стека или только для БД  
  **или** **Python 3.12+**, **Node.js 20+**, **PostgreSQL 16** — для ручного запуска бэкенда и фронта

### Переменные окружения

1. Скопируйте корневой пример и заполните значения:

   ```bash
   cp .env.example .env
   ```

2. Обязательно задайте: `DATABASE_URL`, `SECRET_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (ключи — в [Cloudinary Dashboard](https://cloudinary.com/)).

3. Для фронтенда в режиме разработки:

   ```bash
   cp frontend/.env.example frontend/.env
   ```

   `VITE_API_URL=/api` — Vite проксирует запросы на бэкенд (см. `frontend/vite.config.ts`).

---

### Вариант 1: всё в Docker Compose

Подходит, чтобы поднять БД, API и статику фронта одной командой.

```bash
docker compose up --build
```

После **первого** запуска примените миграции (бэкенд сам их не накатывает):

```bash
docker compose run --rm backend alembic upgrade head
```

- Сайт: **http://localhost** (nginx → `/api` на бэкенд, SPA на `/`)
- API напрямую: **http://localhost:8000** (если порт проброшен)

В `.env` для этого режима используйте `DATABASE_URL` с хостом `db`, как в `.env.example`, и `CORS_ORIGINS=http://localhost`.

---

### Вариант 2: разработка на машине (бэкенд + Vite)

Удобно для горячей перезагрузки фронта и API.

#### 1. PostgreSQL

Нужна база `re_store`, пользователь и пароль должны совпадать с `DATABASE_URL`.

Проще всего — контейнер с пробросом порта:

```bash
docker run -d --name re_store_pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=re_store \
  -p 5432:5432 \
  postgres:16
```

#### 2. Бэкенд

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

В `.env` укажите, например:

- `DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/re_store`
- `CORS_ORIGINS=http://localhost:5173`

Миграции и запуск:

```bash
alembic upgrade head
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Проверка: **http://localhost:8000/health**

#### 3. Фронтенд

```bash
cd frontend
npm ci
npm run dev
```

Откройте **http://localhost:5173** — запросы к `/api` и `/uploads` проксируются на `http://localhost:8000`.

---

### Сборка фронта отдельно

```bash
cd frontend
npm ci
npm run build
```

Статика в `frontend/dist`; для прод-сервера настройте прокси `/api` и `/uploads` на бэкенд (аналогично `frontend/nginx.conf` в Docker).

---

### Запуск тестов

```bash
pytest tests/
```

---

## Структура проекта

```
.
├── alembic/          # Миграции БД
├── core/             # Конфиг, зависимости, безопасность
├── models/           # SQLAlchemy модели
├── routers/          # Эндпоинты API
├── schemas/          # Pydantic схемы
├── services/         # Бизнес-логика
├── tests/            # Pytest тесты
├── frontend/         # React (Vite)
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

---

## Скриншоты


![Главная страница](screenshot1.png)

![Профиль пользователя](screenshot2.png)

![Панель управления](screenshot3.png)

![Панель управления — деталь](screenshot4.png)

![Страница игры](screenshot5.png)

---

## Автор

**aibariok67** — [GitHub](https://github.com/aibariok67-dotcom)
