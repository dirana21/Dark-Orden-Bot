import { ensureAuthSchema } from "./ensure-auth-schema";

let initialization: Promise<void> | null = null;

const tableSql = `CREATE TABLE IF NOT EXISTS build_skills (
  id TEXT PRIMARY KEY NOT NULL,
  guild_id TEXT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  character TEXT NOT NULL,
  slot_type TEXT NOT NULL DEFAULT 'normal',
  slot_index INTEGER NOT NULL DEFAULT 0,
  socket_types TEXT NOT NULL DEFAULT '[]',
  name TEXT NOT NULL,
  description_html TEXT NOT NULL,
  icon_key TEXT NOT NULL,
  icon_content_type TEXT NOT NULL,
  alternate_name TEXT,
  alternate_description_html TEXT,
  alternate_icon_key TEXT,
  alternate_icon_content_type TEXT,
  combo_available INTEGER NOT NULL DEFAULT 0,
  created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
)`;

const indexSql = `CREATE INDEX IF NOT EXISTS build_skills_guild_character_idx
  ON build_skills (guild_id, character, created_at)`;

const slotIndexSql = `CREATE UNIQUE INDEX IF NOT EXISTS build_skills_guild_character_slot_idx
  ON build_skills (guild_id, character, slot_type, slot_index)`;

const backfillSlotsSql = `WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY guild_id, character
           ORDER BY created_at, id
         ) AS position
  FROM build_skills
  WHERE slot_index = 0
)
UPDATE build_skills
SET slot_index = (
  SELECT position FROM ranked WHERE ranked.id = build_skills.id
)
WHERE slot_index = 0`;

const settingsTableSql = `CREATE TABLE IF NOT EXISTS user_build_skill_settings (
  skill_id TEXT NOT NULL REFERENCES build_skills(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  combo_enabled INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (skill_id, user_id)
)`;

const settingsIndexSql = `CREATE INDEX IF NOT EXISTS user_build_skill_settings_user_idx
  ON user_build_skill_settings (user_id)`;

const slotIconsTableSql = `CREATE TABLE IF NOT EXISTS build_skill_slot_icons (
  guild_id TEXT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  character TEXT NOT NULL,
  slot_type TEXT NOT NULL,
  slot_index INTEGER NOT NULL,
  icon_key TEXT NOT NULL,
  icon_content_type TEXT NOT NULL,
  alternate_icon_key TEXT,
  alternate_icon_content_type TEXT,
  created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (guild_id, character, slot_type, slot_index)
)`;

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
          db.prepare(slotIconsTableSql),
        ];
        if (!columns.results.some((column) => column.name === "combo_available")) {
          statements.unshift(
            db.prepare(
              "ALTER TABLE build_skills ADD COLUMN combo_available INTEGER NOT NULL DEFAULT 0",
            ),
          );
        }
        if (!columns.results.some((column) => column.name === "slot_type")) {
          statements.unshift(
            db.prepare(
              "ALTER TABLE build_skills ADD COLUMN slot_type TEXT NOT NULL DEFAULT 'normal'",
            ),
          );
        }
        if (!columns.results.some((column) => column.name === "slot_index")) {
          statements.unshift(
            db.prepare(
              "ALTER TABLE build_skills ADD COLUMN slot_index INTEGER NOT NULL DEFAULT 0",
            ),
          );
        }
        if (!columns.results.some((column) => column.name === "socket_types")) {
          statements.unshift(
            db.prepare(
              "ALTER TABLE build_skills ADD COLUMN socket_types TEXT NOT NULL DEFAULT '[]'",
            ),
          );
        }
        if (!columns.results.some((column) => column.name === "alternate_name")) {
          statements.unshift(db.prepare("ALTER TABLE build_skills ADD COLUMN alternate_name TEXT"));
        }
        if (!columns.results.some((column) => column.name === "alternate_description_html")) {
          statements.unshift(db.prepare("ALTER TABLE build_skills ADD COLUMN alternate_description_html TEXT"));
        }
        if (!columns.results.some((column) => column.name === "alternate_icon_key")) {
          statements.unshift(db.prepare("ALTER TABLE build_skills ADD COLUMN alternate_icon_key TEXT"));
        }
        if (!columns.results.some((column) => column.name === "alternate_icon_content_type")) {
          statements.unshift(db.prepare("ALTER TABLE build_skills ADD COLUMN alternate_icon_content_type TEXT"));
        }
        await db.batch(statements);
        const slotIconColumns = await db
          .prepare("PRAGMA table_info(build_skill_slot_icons)")
          .all<TableColumnRow>();
        const slotIconStatements = [];
        if (!slotIconColumns.results.some((column) => column.name === "alternate_icon_key")) {
          slotIconStatements.push(db.prepare("ALTER TABLE build_skill_slot_icons ADD COLUMN alternate_icon_key TEXT"));
        }
        if (!slotIconColumns.results.some((column) => column.name === "alternate_icon_content_type")) {
          slotIconStatements.push(db.prepare("ALTER TABLE build_skill_slot_icons ADD COLUMN alternate_icon_content_type TEXT"));
        }
        if (slotIconStatements.length) {
          await db.batch(slotIconStatements);
        }
        await db.prepare(backfillSlotsSql).run();
        await db.prepare(slotIndexSql).run();
      })
      .catch((error: unknown) => {
        initialization = null;
        throw error;
      });
  }

  await initialization;
}
