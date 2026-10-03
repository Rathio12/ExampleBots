# Deployment

![discord.py](https://img.shields.io/badge/discord.py-2.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[Python portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Used in** | [03-expert Dockerfile](../../python/03-expert/Dockerfile) · [docker-compose.yml](../../python/03-expert/docker-compose.yml) |

## Production checklist

- [ ] A virtual environment (or Docker image) with `pip install -r requirements.txt`
- [ ] `ENVIRONMENT=production` for JSON logs (expert bot)
- [ ] Token in environment variables or a protected `.env`
- [ ] Process manager restarts on crash and reboot
- [ ] Database on persistent storage, backed up
- [ ] SIGTERM handled (the expert bot closes cleanly)

## Docker

```dockerfile
FROM python:3.13-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 ENVIRONMENT=production DATABASE_PATH=/app/data/bot.db
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY bot ./bot
RUN useradd --create-home bot && mkdir -p /app/data && chown -R bot:bot /app/data
USER bot
VOLUME ["/app/data"]
CMD ["python", "-m", "bot"]
```

`PYTHONUNBUFFERED=1` makes logs appear immediately in `docker logs`.

```bash
docker compose up -d --build
docker compose logs -f
```

## systemd

```ini
[Service]
User=bot
WorkingDirectory=/opt/discord-bot
EnvironmentFile=/opt/discord-bot/.env
ExecStart=/opt/discord-bot/.venv/bin/python -m bot
Restart=always
RestartSec=5
```

Full unit file: [Deployment & Hosting](../Deployment-and-Hosting.md#option-b-systemd-linux-no-docker).

## Graceful shutdown

```python
class MyBot(commands.Bot):
    async def setup_hook(self) -> None:
        try:
            asyncio.get_running_loop().add_signal_handler(signal.SIGTERM, lambda: asyncio.create_task(self.close()))
        except NotImplementedError:
            pass                       # Windows

    async def close(self) -> None:
        await super().close()
        await self.db.close()
```

`bot.run()` already handles Ctrl+C (SIGINT).

## Updating

```bash
git pull
source .venv/bin/activate && pip install -r requirements.txt
sudo systemctl restart discord-bot     # or: docker compose up -d --build
```

Commands are re-synced in `setup_hook`, and migrations run on startup.

## Performance tips

- `pip install "discord.py[speed]"` for faster JSON and compression.
- On Linux, `uvloop` speeds up asyncio: `import uvloop; uvloop.install()` before running.
- Tune `max_messages` and `member_cache_flags` to control memory.

## See also
- [Deployment & Hosting](../Deployment-and-Hosting.md) · [Logging](39-Logging.md) · [Sharding](40-Sharding.md)
