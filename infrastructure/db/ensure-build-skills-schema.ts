import { ensureAuthSchema } from "./ensure-auth-schema";

let initialization: Promise<void> | null = null;

const tableSql = `CREATE TABLE IF NOT EXISTS build_skills (
  id TEXT PRIMARY KEY NOT NULL,
  guild_id TEXT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  character TEXT NOT NULL,
  name TEXT NOT NULL,
  description_html TEXT NOT NULL,
  icon_key TEXT NOT NULL,
  icon_content_type TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
)`;

const indexSql = `CREATE INDEX IF NOT EXISTS build_skills_guild_character_idx
  ON build_skills (guild_id, character, created_at)`;

export async function ensureBuildSkillsSchema(
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
