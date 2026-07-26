FROM python:3.12-slim

WORKDIR /app

# Monorepo hygiene: prevent Python from writing .pyc/__pycache__ inside the image
# (complements backend/.dockerignore + backend/.gitignore).
# PYTHONUNBUFFERED ensures logs are emitted immediately (good for Docker).
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml .
RUN pip install --no-cache-dir .

# Context is already filtered by backend/.dockerignore (prevents __pycache__, *.pyc, .env*, etc.)
COPY . .

RUN chmod +x /app/scripts/entrypoint.sh \
    && useradd --create-home --shell /bin/bash appuser \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

# 127.0.0.1 avoids IPv6 localhost mismatch on VPS/Dokploy hosts.
# start-period covers cold-start syncs before Uvicorn binds (Dokploy/VPS).
HEALTHCHECK --interval=15s --timeout=8s --start-period=180s --retries=6 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health').status == 200 else 1)"

ENTRYPOINT ["/app/scripts/entrypoint.sh"]
