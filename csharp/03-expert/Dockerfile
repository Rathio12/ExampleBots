# ---- Build stage: restore, test and publish with the full SDK
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
RUN dotnet test tests/ExpertBot.Tests -c Release
RUN dotnet publish src/ExpertBot -c Release -o /app

# ---- Runtime stage: only the .NET runtime, non-root user
FROM mcr.microsoft.com/dotnet/runtime:10.0
WORKDIR /app
COPY --from=build /app .

ENV ENVIRONMENT=production \
    DATABASE_PATH=/app/data/bot.db
RUN mkdir -p /app/data && chown -R app:app /app/data
VOLUME ["/app/data"]
USER app

ENTRYPOINT ["dotnet", "ExpertBot.dll"]
