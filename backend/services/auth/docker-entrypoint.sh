#!/usr/bin/env bash
set -e

if [ -z "$ADMIN_PASSWORD_HASH" ]; then
    echo "[entrypoint] ADMIN_PASSWORD_HASH not set, auto-generating (default password: admin123)"
    export ADMIN_PASSWORD_HASH=$(python -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt'], deprecated='auto').hash('admin123'))")
    echo "[entrypoint] ADMIN_PASSWORD_HASH generated"
fi

echo "[entrypoint] Running database migrations..."
alembic upgrade head

echo "[entrypoint] Starting auth service on port 8001..."
exec uvicorn main:app --host 0.0.0.0 --port 8001
