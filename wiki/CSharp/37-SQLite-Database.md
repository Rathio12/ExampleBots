# SQLite Database

![Discord.Net](https://img.shields.io/badge/Discord.Net-3.x-5865F2?logo=discord&logoColor=white&style=flat-square) ![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet&logoColor=white&style=flat-square) ![category](https://img.shields.io/badge/category-Production-8E8E93?style=flat-square) ![level](https://img.shields.io/badge/level-advanced-ED4245?style=flat-square)

<sub>[C# portal](README.md) › Building real bots</sub>

| | |
|---|---|
| **Packages** | `Microsoft.Data.Sqlite` (optionally `Dapper` or EF Core) |
| **Used in** | [03-expert Data/](../../csharp/03-expert/src/ExpertBot/Data) |

```bash
dotnet add package Microsoft.Data.Sqlite
```

## Connections

`SqliteConnection` isn't thread-safe, and Discord events arrive concurrently. Open a connection per operation (pooling makes this cheap):

```csharp
await using var connection = new SqliteConnection("Data Source=data/bot.db");
await connection.OpenAsync();
```

Run `PRAGMA journal_mode = WAL;` once at startup for better concurrency.

## Queries with parameters

```csharp
await using var command = connection.CreateCommand();
command.CommandText = "INSERT INTO warnings (guild_id, user_id, reason, created_at) VALUES ($g, $u, $r, $t) RETURNING id;";
command.Parameters.AddWithValue("$g", (long)guildId);          // SQLite stores signed 64-bit integers
command.Parameters.AddWithValue("$u", (long)userId);
command.Parameters.AddWithValue("$r", reason);
command.Parameters.AddWithValue("$t", DateTimeOffset.UtcNow.ToUnixTimeSeconds());
var id = (long)(await command.ExecuteScalarAsync())!;

command.CommandText = "SELECT id, reason FROM warnings WHERE guild_id = $g AND user_id = $u ORDER BY id DESC;";
await using var reader = await command.ExecuteReaderAsync();
while (await reader.ReadAsync())
    Console.WriteLine($"#{reader.GetInt64(0)}: {reader.GetString(1)}");
```

**Always bind values as parameters.** Never interpolate user input into SQL.

## Small helpers (expert bot)

The expert bot's `Database` class wraps the boilerplate:

```csharp
public async Task<List<T>> QueryAsync<T>(string sql, Func<SqliteDataReader, T> map, params (string Name, object? Value)[] parameters)
{
    await using var connection = Open();
    await using var command = connection.CreateCommand();
    command.CommandText = sql;
    foreach (var (name, value) in parameters) command.Parameters.AddWithValue(name, value ?? DBNull.Value);
    await using var reader = await command.ExecuteReaderAsync();
    var results = new List<T>();
    while (await reader.ReadAsync()) results.Add(map(reader));
    return results;
}

// usage in a repository
public Task<List<WarningRow>> ListAsync(ulong guildId, ulong userId) =>
    db.QueryAsync("SELECT id, moderator_id, reason, created_at FROM warnings WHERE guild_id = $g AND user_id = $u ORDER BY id DESC;",
        r => new WarningRow(r.GetInt64(0), (ulong)r.GetInt64(1), r.GetString(2), r.GetInt64(3)),
        ("$g", (long)guildId), ("$u", (long)userId));
```

## Dapper (less code)

```bash
dotnet add package Dapper
```

```csharp
public sealed record Warning(long Id, long ModeratorId, string Reason, long CreatedAt);

await using var connection = new SqliteConnection(cs);
var warnings = await connection.QueryAsync<Warning>(
    "SELECT id, moderator_id AS ModeratorId, reason, created_at AS CreatedAt FROM warnings WHERE guild_id = @g AND user_id = @u",
    new { g = (long)guildId, u = (long)userId });
```

## Migrations

```csharp
private static readonly string[] Migrations =
[
    "CREATE TABLE levels (guild_id INTEGER NOT NULL, user_id INTEGER NOT NULL, xp INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (guild_id, user_id));",
    "ALTER TABLE levels ADD COLUMN last_message_at INTEGER;",
];

var current = Convert.ToInt32(Scalar(connection, "PRAGMA user_version;"));
for (var version = current; version < Migrations.Length; version++)
{
    using var transaction = connection.BeginTransaction();
    Execute(connection, Migrations[version]);
    Execute(connection, $"PRAGMA user_version = {version + 1};");
    transaction.Commit();
}
```

For EF Core, use `dotnet ef migrations add Initial` instead.

## Upsert

```sql
INSERT INTO levels (guild_id, user_id, xp) VALUES ($g, $u, $xp)
ON CONFLICT (guild_id, user_id) DO UPDATE SET xp = xp + excluded.xp
RETURNING xp;
```

## In-memory databases for tests

```csharp
var cs = $"Data Source=mem-{Guid.NewGuid():N};Mode=Memory;Cache=Shared";
var keepAlive = new SqliteConnection(cs);   // the DB lives as long as one connection stays open
keepAlive.Open();
```

## See also
- [Databases & Persistence](../Databases-and-Persistence.md) · [Testing](41-Testing.md)
