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

RUN useradd --create-home --shell /bin/bash appuser \
    && chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
