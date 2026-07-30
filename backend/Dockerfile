# syntax=docker/dockerfile:1.7

# ── Stage 1: builder ────────────────────────────────────────────────
# Installs uv (fast Python installer) and all dependencies.
# Cache mount preserves uv downloads between builds.
FROM python:3.12-slim AS builder
WORKDIR /app
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

RUN pip install --no-cache-dir uv

# Copy only pyproject.toml first — maximizes layer caching when only code changes.
COPY pyproject.toml ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system --no-cache .

# Now copy the application source.
COPY . .

# ── Stage 2: runtime ────────────────────────────────────────────────
# Clean image with only installed packages + application code.
# No build tools, no pip, no uv — minimal attack surface and size.
FROM python:3.12-slim AS runtime
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH=/usr/local/bin:$PATH

# Copy only the installed packages and their CLI entrypoints from builder.
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code.
COPY --from=builder /app /app

# Non-root user for security.
RUN useradd --create-home --shell /bin/bash appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# 127.0.0.1 avoids IPv6 localhost mismatch on VPS/Dokploy hosts.
# start-period covers cold-start syncs before Uvicorn binds (Dokploy/VPS).
HEALTHCHECK --interval=15s --timeout=8s --start-period=180s --retries=6 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health').status == 200 else 1)"

ENTRYPOINT ["/app/scripts/entrypoint.sh"]
