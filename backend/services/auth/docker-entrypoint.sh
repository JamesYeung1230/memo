#!/usr/bin/env bash
set -e

if [ -z "$ADMIN_PASSWORD_HASH" ]; then
    echo "[entrypoint] ADMIN_PASSWORD_HASH not set, auto-generating (default password: admin123)"
    export ADMIN_PASSWORD_HASH=$(python -c "import bcrypt; print(bcrypt.hashpw(b'admin123', bcrypt.gensalt(rounds=12)).decode())")
    echo "[entrypoint] ADMIN_PASSWORD_HASH generated"
fi

echo "[entrypoint] Running database migrations..."
if alembic upgrade head; then
    echo "[entrypoint] Database migrations completed successfully"
else
    echo "[entrypoint] ERROR: Database migrations failed!"
    echo "[entrypoint] Check database connection and env vars (DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME)"
    exit 1
fi

echo "[entrypoint] Ensuring admin account password hash is up-to-date..."
python -c '
import asyncio, os

async def main():
    import asyncpg
    conn = await asyncpg.connect(
        user=os.environ["DB_USER"],
        password=os.environ.get("DB_PASSWORD", "postgres"),
        host=os.environ.get("DB_HOST", "postgres"),
        port=int(os.environ.get("DB_PORT", 5432)),
        database=os.environ.get("DB_NAME", "codesail"),
    )
    try:
        username = os.environ.get("ADMIN_USERNAME", "admin")
        password_hash = os.environ["ADMIN_PASSWORD_HASH"]
        await conn.execute("""
            INSERT INTO auth.admin (username, password_hash)
            VALUES ($1, $2)
            ON CONFLICT (username)
            DO UPDATE SET password_hash = $2
        """, username, password_hash)
    finally:
        await conn.close()

asyncio.run(main())
'
echo "[entrypoint] Admin account ensured"

echo "[entrypoint] Starting auth service on port 8001..."
exec uvicorn main:app --host 0.0.0.0 --port 8001
