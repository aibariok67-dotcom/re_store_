#!/bin/sh
set -e

# Контейнер стартует от root только для подготовки тома uploads (named volume
# часто монтируется с root:root). Рабочий процесс — uvicorn под пользователем app.
if [ "$(id -u)" = "0" ]; then
  mkdir -p /app/uploads
  chown -R app:app /app/uploads
  exec /usr/sbin/runuser -u app -g app -- "$0" "$@"
fi

exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
