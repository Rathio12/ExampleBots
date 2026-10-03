FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    ENVIRONMENT=production \
    DATABASE_PATH=/app/data/bot.db

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY bot ./bot

# Run as an unprivileged user; the database lives in a volume.
RUN useradd --create-home bot && mkdir -p /app/data && chown -R bot:bot /app/data
USER bot
VOLUME ["/app/data"]

CMD ["python", "-m", "bot"]
