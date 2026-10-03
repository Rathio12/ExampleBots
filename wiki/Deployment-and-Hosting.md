# Deployment & Hosting

A bot must run 24/7 to stay online. Your PC is fine for development, but anything real belongs on a server.

## Where to host

| Option | Cost | Effort | Notes |
|---|---|---|---|
| Your own PC | Free | Low | Offline when the PC is off. Fine for testing. |
| Raspberry Pi / home server | Hardware only | Medium | Great for small bots. Use Docker or systemd. |
| **VPS** (Hetzner, DigitalOcean, OVH, Linode, Vultr…) | ~€4–6/month | Medium | Most popular. Full control. |
| Cloud free tiers (Oracle, Google) | Free with limits | Medium–high | Real VMs, but sign-up and limits can be tricky |
| PaaS (Railway, Fly.io, Render) | Free–paid | Low | Deploy from GitHub. Check how storage persists for SQLite. |
| "Free Discord bot hosting" sites | Free | Low | Often unreliable, and some steal tokens. **Be careful.** |

A small-to-medium bot runs comfortably in 512 MB RAM.

## Option A: Docker (recommended)

Every expert bot ships a `Dockerfile` and `docker-compose.yml`.

```bash
git clone https://github.com/you/your-bot.git && cd your-bot/javascript/03-expert
cp .env.example .env && nano .env
docker compose up -d --build     # build and start in the background
docker compose logs -f           # follow logs
git pull && docker compose up -d --build   # update
```

- `restart: unless-stopped` brings the bot back after crashes and reboots.
- The database lives in the named volume `bot-data`, so it survives rebuilds.
- The images run as a **non-root** user.

Install Docker on Ubuntu/Debian: `curl -fsSL https://get.docker.com | sh`.

## Option B: systemd (Linux, no Docker)

`/etc/systemd/system/discord-bot.service`:

```ini
[Unit]
Description=Discord bot
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=bot
WorkingDirectory=/opt/discord-bot
EnvironmentFile=/opt/discord-bot/.env
# choose one:
ExecStart=/usr/bin/node src/index.js
# ExecStart=/opt/discord-bot/.venv/bin/python -m bot
# ExecStart=/usr/bin/dotnet /opt/discord-bot/publish/ExpertBot.dll
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo useradd --system --home /opt/discord-bot bot
sudo systemctl daemon-reload
sudo systemctl enable --now discord-bot
journalctl -u discord-bot -f
```

All expert bots handle `SIGTERM`, so `systemctl stop` shuts them down cleanly.

## Option C: pm2 (Node.js)

```bash
npm install -g pm2
pm2 start src/index.js --name my-bot
pm2 save && pm2 startup
pm2 logs my-bot
```

## Option D: Windows

- Task Scheduler → trigger "At startup" → run `node src/index.js` with the bot folder as "Start in".
- Or install it as a service with [NSSM](https://nssm.cc/). .NET apps can use `Microsoft.Extensions.Hosting.WindowsServices`.

## Production builds

| Language | Build | Run |
|---|---|---|
| JavaScript | `npm ci --omit=dev` | `NODE_ENV=production node src/index.js` |
| Python | `python -m venv .venv && .venv/bin/pip install -r requirements.txt` | `ENVIRONMENT=production .venv/bin/python -m bot` |
| C# | `dotnet publish src/ExpertBot -c Release -o publish` | `ENVIRONMENT=production dotnet publish/ExpertBot.dll` |

## Secrets

- `.env` stays out of git (already in `.gitignore`).
- On servers: `chmod 600 .env`, owned by the bot user.
- On PaaS, use the dashboard's environment variables.
- Real environment variables override `.env` in all examples.

## Logs

The expert bots print JSON lines in production. Cap Docker log size:

```yaml
    logging:
      driver: json-file
      options: { max-size: "10m", max-file: "3" }
```

## Backups

```bash
# crontab -e: daily at 04:00, keep 14 days
0 4 * * * sqlite3 /opt/discord-bot/data/bot.db ".backup '/opt/backups/bot-$(date +\%F).db'" && find /opt/backups -name 'bot-*.db' -mtime +14 -delete
```

Docker volume: `docker run --rm -v bot-data:/data -v "$PWD":/backup alpine cp /data/bot.db /backup/`. Copy backups **off** the server (rclone → S3, Backblaze, Google Drive).

## Updating safely

1. `git pull`
2. Re-register commands if they changed (`npm run deploy` for JS. Python and C# sync on start.)
3. Restart (`docker compose up -d --build`, `systemctl restart discord-bot`, `pm2 restart my-bot`).
4. Watch the logs for a minute. Migrations apply automatically.

## Monitoring

Push a heartbeat to [Uptime Kuma](https://github.com/louislam/uptime-kuma), Better Stack or Healthchecks.io every minute, and alert when it stops.

## Scaling

- **2,500+ servers:** sharding is mandatory.
- **Multiple processes:** move from SQLite to PostgreSQL and from in-memory cooldowns to Redis.
- **100+ servers with privileged intents:** apply for verification before you hit the limit.
