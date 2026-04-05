#!/bin/sh
set -e

if [ "$(id -u)" = "0" ]; then
  mkdir -p /app/uploads
  chown -R app:app /app/uploads
  exec /usr/sbin/runuser -u app -g app -- "$0" "$@"
fi

exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
