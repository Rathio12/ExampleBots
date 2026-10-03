# Deployment

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-intermediate-FEE75C?style=flat-square)

<sub>[C# portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Used in** | [03-expert Dockerfile](../../csharp/03-expert/Dockerfile) · [docker-compose.yml](../../csharp/03-expert/docker-compose.yml) |

## Publishing

```bash
dotnet publish src/ExpertBot -c Release -o publish
dotnet publish/ExpertBot.dll                       # needs the .NET runtime on the server
```

Self-contained (no runtime needed on the server):

```bash
dotnet publish src/ExpertBot -c Release -r linux-x64 --self-contained -p:PublishSingleFile=true -o publish
./publish/ExpertBot
```

## Docker

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
RUN dotnet test tests/ExpertBot.Tests -c Release
RUN dotnet publish src/ExpertBot -c Release -o /app

FROM mcr.microsoft.com/dotnet/runtime:10.0
WORKDIR /app
COPY --from=build /app .
ENV ENVIRONMENT=production DATABASE_PATH=/app/data/bot.db
RUN mkdir -p /app/data && chown -R app:app /app/data
VOLUME ["/app/data"]
USER app
ENTRYPOINT ["dotnet", "ExpertBot.dll"]
```

The official .NET images include a non-root `app` user. The bot only needs the **runtime** image (not ASP.NET).

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
ExecStart=/usr/bin/dotnet /opt/discord-bot/publish/ExpertBot.dll
Restart=always
RestartSec=5
```

With the Generic Host, add `Microsoft.Extensions.Hosting.Systemd` and `builder.Services.AddSystemd()` for proper start/stop notifications.

## Windows service

```bash
dotnet add package Microsoft.Extensions.Hosting.WindowsServices
```

```csharp
builder.Services.AddWindowsService(o => o.ServiceName = "Discord Bot");
```

```powershell
sc.exe create "Discord Bot" binPath= "C:\bots\ExpertBot\ExpertBot.exe" start= auto
sc.exe start "Discord Bot"
```

## Graceful shutdown

`host.RunAsync()` listens for Ctrl+C and SIGTERM, calls `StopAsync` on every hosted service (log out of Discord, stop background loops), then exits. The default shutdown timeout is 30 seconds:

```csharp
builder.Services.Configure<HostOptions>(o => o.ShutdownTimeout = TimeSpan.FromSeconds(15));
```

## Updating

```bash
git pull
dotnet publish src/ExpertBot -c Release -o publish
sudo systemctl restart discord-bot     # or: docker compose up -d --build
```

Commands re-register on `Ready`, and migrations run on startup.

## See also
- [Deployment & Hosting](../Deployment-and-Hosting.md) · [Logging](39-Logging.md) · [Sharding](40-Sharding.md)
