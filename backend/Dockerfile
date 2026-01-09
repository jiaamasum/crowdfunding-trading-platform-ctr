# Backend Dockerfile for Django API
# Multi-stage build for optimized production image

# ============================================
# Stage 1: Builder
# ============================================
FROM python:3.12-slim as builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt


# ============================================
# Stage 2: Production
# ============================================
FROM python:3.12-slim as production

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    # App settings
    APP_HOME=/app \
    APP_USER=appuser

# Create non-root user for security
RUN groupadd --gid 1000 ${APP_USER} \
    && useradd --uid 1000 --gid ${APP_USER} --shell /bin/bash --create-home ${APP_USER}

WORKDIR ${APP_HOME}

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy wheels from builder and install
COPY --from=builder /app/wheels /wheels
COPY --from=builder /app/requirements.txt .
RUN pip install --no-cache-dir /wheels/* \
    && pip install --no-cache-dir gunicorn \
    && rm -rf /wheels

# Copy application code
COPY --chown=${APP_USER}:${APP_USER} . .

# Create directories for static files and media
RUN mkdir -p staticfiles media logs \
    && chown -R ${APP_USER}:${APP_USER} staticfiles media logs

# Switch to non-root user
USER ${APP_USER}

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health/ || exit 1

# Default command: run gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--threads", "2", "--worker-class", "gthread", "--access-logfile", "-", "--error-logfile", "-", "config.wsgi:application"]
