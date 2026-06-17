# syntax=docker/dockerfile:1

FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim AS runtime
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DOMYTASKS_DB_PATH=/data/domytasks.db
ENV DOMYTASKS_PORT=3603
ENV DOMYTASKS_STATIC_DIR=/app/static

COPY backend/pyproject.toml /app/backend/
COPY backend/domytasks /app/backend/domytasks
RUN pip install --no-cache-dir /app/backend

COPY --from=frontend-build /app/frontend/out /app/static

EXPOSE 3603
VOLUME ["/data"]

CMD ["uvicorn", "domytasks.main:app", "--host", "0.0.0.0", "--port", "3603"]
