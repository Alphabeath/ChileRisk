FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install uv (fast Python installer, 10-100x faster than pip).
RUN pip install --no-cache-dir uv

# Copy only pyproject.toml first — layer is cached when only code changes.
COPY pyproject.toml ./
RUN uv pip install --system --no-cache .

# Copy application source (filtered by .dockerignore).
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
