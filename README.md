# GenBI

Генеративная аналитическая платформа для работы с данными по алюминию и сырью.

Задаёте вопрос простым языком — получаете текстовый анализ, графики и расчёты.

## Стек

- **Frontend:** React 18 + TypeScript + Tailwind CSS + Recharts
- **Backend:** FastAPI (Python)
- **LLM:** LiteLLM (OpenAI-compatible)
- **БД:** Greenplum 6 (pgvector для RAG)
- **Кэш:** Redis

## Быстрый старт

```bash
# 1. Скопируйте .env
cp .env.example .env

# 2. Заполните .env своими ключами
#    - GP_PASSWORD
#    - OPENAI_API_KEY
#    - LITELLM_MASTER_KEY

# 3. Запустите через Docker Compose
docker-compose up -d
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- LiteLLM: http://localhost:4000

## Возможности

- **Чат** — вопросы на русском/английском с контекстом сессии
- **Уточняющие вопросы** — ИИ запрашивает недостающие параметры
- **Визуализации** — линейные, столбчатые, scatter, candlestick, таблицы
- **Feedback** — оценка качества ответов для дообучения
- **Экспорт** — выгрузка в PDF/CSV

## Структура проекта

```
backend/          FastAPI — API, сервисы, модели, промпты
frontend/         React — компоненты, страницы, утилиты
litellm_config.yaml   Конфигурация LLM-прокси
docker-compose.yml    Оркестрация всех сервисов
```

## Авторизация

Логин/пароль. Роли: пользователь / администратор / модератор.
