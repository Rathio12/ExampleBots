// Repositories hide SQL behind small, well-named functions. Commands never
// write SQL themselves — they call `repos.warnings.add(...)` etc.
// Statements are prepared once and reused, which is fast and prevents SQL
// injection (values are always bound with `?`, never concatenated).

const now = () => Math.floor(Date.now() / 1000);

function levelRepository(db) {
  const add = db.prepare(`
    INSERT INTO levels (guild_id, user_id, xp) VALUES (?, ?, ?)
    ON CONFLICT (guild_id, user_id) DO UPDATE SET xp = xp + excluded.xp
    RETURNING xp`);
  const get = db.prepare('SELECT xp FROM levels WHERE guild_id = ? AND user_id = ?');
  const rank = db.prepare('SELECT COUNT(*) + 1 AS rank FROM levels WHERE guild_id = ? AND xp > ?');
  const top = db.prepare('SELECT user_id AS userId, xp FROM levels WHERE guild_id = ? ORDER BY xp DESC LIMIT ? OFFSET ?');
  const count = db.prepare('SELECT COUNT(*) AS total FROM levels WHERE guild_id = ?');

  return {
    /** Adds XP and returns the new total. */
    addXp: (guildId, userId, amount) => add.get(guildId, userId, amount).xp,
    getXp: (guildId, userId) => get.get(guildId, userId)?.xp ?? 0,
    getRank: (guildId, xp) => rank.get(guildId, xp).rank,
    getTop: (guildId, limit, offset = 0) => top.all(guildId, limit, offset),
    count: (guildId) => count.get(guildId).total,
  };
}

function warningRepository(db) {
  const add = db.prepare(
    'INSERT INTO warnings (guild_id, user_id, moderator_id, reason, created_at) VALUES (?, ?, ?, ?, ?)',
  );
  const list = db.prepare(`
    SELECT id, moderator_id AS moderatorId, reason, created_at AS createdAt
    FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY id DESC`);
  const clear = db.prepare('DELETE FROM warnings WHERE guild_id = ? AND user_id = ?');

  return {
    /** Adds a warning and returns its ID. */
    add: (guildId, userId, moderatorId, reason) =>
      Number(add.run(guildId, userId, moderatorId, reason, now()).lastInsertRowid),
    list: (guildId, userId) => list.all(guildId, userId),
    /** Deletes all warnings and returns how many were removed. */
    clear: (guildId, userId) => clear.run(guildId, userId).changes,
  };
}

function reminderRepository(db) {
  const add = db.prepare(
    'INSERT INTO reminders (user_id, channel_id, message, remind_at, created_at) VALUES (?, ?, ?, ?, ?)',
  );
  const due = db.prepare(`
    SELECT id, user_id AS userId, channel_id AS channelId, message, created_at AS createdAt
    FROM reminders WHERE remind_at <= ? ORDER BY remind_at LIMIT 50`);
  const listForUser = db.prepare(
    'SELECT id, message, remind_at AS remindAt FROM reminders WHERE user_id = ? ORDER BY remind_at',
  );
  const countForUser = db.prepare('SELECT COUNT(*) AS total FROM reminders WHERE user_id = ?');
  const remove = db.prepare('DELETE FROM reminders WHERE id = ?');
  const removeForUser = db.prepare('DELETE FROM reminders WHERE id = ? AND user_id = ?');

  return {
    add: (userId, channelId, message, remindAt) =>
      Number(add.run(userId, channelId, message, remindAt, now()).lastInsertRowid),
    due: (timestamp = now()) => due.all(timestamp),
    listForUser: (userId) => listForUser.all(userId),
    countForUser: (userId) => countForUser.get(userId).total,
    remove: (id) => remove.run(id),
    /** Only deletes if the reminder belongs to the user. Returns true on success. */
    removeForUser: (id, userId) => removeForUser.run(id, userId).changes > 0,
  };
}

function tagRepository(db) {
  const get = db.prepare('SELECT name, content, author_id AS authorId, uses FROM tags WHERE guild_id = ? AND name = ?');
  const create = db.prepare(
    'INSERT INTO tags (guild_id, name, content, author_id, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING',
  );
  const remove = db.prepare('DELETE FROM tags WHERE guild_id = ? AND name = ?');
  const use = db.prepare('UPDATE tags SET uses = uses + 1 WHERE guild_id = ? AND name = ?');
  const search = db.prepare("SELECT name FROM tags WHERE guild_id = ? AND name LIKE ? ESCAPE '\\' ORDER BY uses DESC LIMIT ?");
  const list = db.prepare('SELECT name, uses FROM tags WHERE guild_id = ? ORDER BY name');

  return {
    get: (guildId, name) => get.get(guildId, name),
    /** Returns false if a tag with that name already exists. */
    create: (guildId, name, content, authorId) => create.run(guildId, name, content, authorId, now()).changes > 0,
    remove: (guildId, name) => remove.run(guildId, name).changes > 0,
    use: (guildId, name) => use.run(guildId, name),
    /** Prefix search for autocomplete. `%` and `_` are escaped so users can't inject wildcards. */
    search: (guildId, prefix, limit = 25) =>
      search.all(guildId, `${prefix.replace(/[\\%_]/g, '\\$&')}%`, limit).map((row) => row.name),
    list: (guildId) => list.all(guildId),
  };
}

function settingsRepository(db) {
  const get = db.prepare(`
    SELECT modlog_channel_id AS modlogChannelId, auditlog_channel_id AS auditlogChannelId
    FROM guild_settings WHERE guild_id = ?`);
  const upsert = (column) =>
    db.prepare(`
      INSERT INTO guild_settings (guild_id, ${column}) VALUES (?, ?)
      ON CONFLICT (guild_id) DO UPDATE SET ${column} = excluded.${column}`);
  const setModlog = upsert('modlog_channel_id');
  const setAuditlog = upsert('auditlog_channel_id');

  // Settings are read on EVERY audited event, so cache them in memory.
  const cache = new Map();

  return {
    get(guildId) {
      if (!cache.has(guildId)) cache.set(guildId, get.get(guildId) ?? { modlogChannelId: null, auditlogChannelId: null });
      return cache.get(guildId);
    },
    setModlogChannel(guildId, channelId) {
      setModlog.run(guildId, channelId);
      cache.delete(guildId);
    },
    setAuditlogChannel(guildId, channelId) {
      setAuditlog.run(guildId, channelId);
      cache.delete(guildId);
    },
  };
}

export function createRepositories(db) {
  return {
    levels: levelRepository(db),
    warnings: warningRepository(db),
    reminders: reminderRepository(db),
    tags: tagRepository(db),
    settings: settingsRepository(db),
  };
}
