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
  combo_available INTEGER NOT NULL DEFAULT 0,
  created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
)`;

const indexSql = `CREATE INDEX IF NOT EXISTS build_skills_guild_character_idx
  ON build_skills (guild_id, character, created_at)`;

const settingsTableSql = `CREATE TABLE IF NOT EXISTS user_build_skill_settings (
  skill_id TEXT NOT NULL REFERENCES build_skills(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  combo_enabled INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (skill_id, user_id)
)`;

const settingsIndexSql = `CREATE INDEX IF NOT EXISTS user_build_skill_settings_user_idx
  ON user_build_skill_settings (user_id)`;

interface TableColumnRow {
  name: string;
}

export async function ensureBuildSkillsSchema(
  db: D1Database,
): Promise<void> {
  await ensureAuthSchema(db);

  if (!initialization) {
    initialization = db
      .prepare(tableSql)
      .run()
      .then(async () => {
        const columns = await db
          .prepare("PRAGMA table_info(build_skills)")
          .all<TableColumnRow>();
        const statements = [
          db.prepare(indexSql),
          db.prepare(settingsTableSql),
          db.prepare(settingsIndexSql),
        ];
        if (!columns.results.some((column) => column.name === "combo_available")) {
          statements.unshift(
            db.prepare(
              "ALTER TABLE build_skills ADD COLUMN combo_available INTEGER NOT NULL DEFAULT 0",
            ),
          );
        }
        await db.batch(statements);
      })
      .catch((error: unknown) => {
        initialization = null;
        throw error;
      });
  }

  await initialization;
}
