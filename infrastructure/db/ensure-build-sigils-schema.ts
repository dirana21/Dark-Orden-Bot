import { ensureAuthSchema } from "./ensure-auth-schema";

let initialization: Promise<void> | null = null;

const tableSql = `CREATE TABLE IF NOT EXISTS build_sigils (
  id TEXT PRIMARY KEY NOT NULL,
  guild_id TEXT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_key TEXT NOT NULL,
  icon_content_type TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
)`;

const indexSql = `CREATE INDEX IF NOT EXISTS build_sigils_guild_category_idx
  ON build_sigils (guild_id, category, created_at)`;

export async function ensureBuildSigilsSchema(
  db: D1Database,
): Promise<void> {
  await ensureAuthSchema(db);

  if (!initialization) {
    initialization = db
      .batch([db.prepare(tableSql), db.prepare(indexSql)])
      .then(() => undefined)
      .catch((error: unknown) => {
        initialization = null;
        throw error;
      });
  }

  await initialization;
}
