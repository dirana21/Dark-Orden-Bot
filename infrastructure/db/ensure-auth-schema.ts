let initialization: Promise<void> | null = null;

const statements = [
  `CREATE TABLE IF NOT EXISTS guilds (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    guild_id TEXT NOT NULL REFERENCES guilds(id),
    username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    real_name TEXT,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    created_at INTEGER NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS users_guild_id_idx ON users(guild_id)",
  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id)",
  "CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at)",
];

export async function ensureAuthSchema(db: D1Database): Promise<void> {
  if (!initialization) {
    initialization = db
      .batch(statements.map((statement) => db.prepare(statement)))
      .then(async () => {
        const columns = await db
          .prepare("PRAGMA table_info(users)")
          .all<{ name: string }>();

        if (!columns.results.some((column) => column.name === "real_name")) {
          await db
            .prepare("ALTER TABLE users ADD COLUMN real_name TEXT")
            .run();
        }

        await db
          .prepare(
            `INSERT OR IGNORE INTO guilds (id, name, slug, created_at)
             VALUES ('dark-orden', 'Dark Orden', 'dark-orden', 0)`,
          )
          .run();
      })
      .catch((error: unknown) => {
        initialization = null;
        throw error;
      });
  }

  await initialization;
}
