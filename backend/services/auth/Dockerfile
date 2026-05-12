FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY shared/ /app/shared/

COPY services/auth/ /app/services/auth/
WORKDIR /app/services/auth

RUN chmod +x docker-entrypoint.sh

RUN pip install --no-cache-dir -r requirements.txt

ENV PYTHONPATH="/app/shared:/app/services/auth:$PYTHONPATH"

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

EXPOSE 8001

ENTRYPOINT ["./docker-entrypoint.sh"]
