import { buildCharacterClasses } from "@/domain/build/model";
import { ensureAuthSchema } from "./ensure-auth-schema";

let initialization: Promise<void> | null = null;
const seededGuilds = new Map<string, Promise<void>>();

const tableSql = `CREATE TABLE IF NOT EXISTS build_characters (
  id TEXT PRIMARY KEY NOT NULL,
  guild_id TEXT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_key TEXT,
  image_content_type TEXT,
  created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
)`;

const nameIndexSql = `CREATE UNIQUE INDEX IF NOT EXISTS build_characters_guild_name_idx
  ON build_characters (guild_id, name)`;

const createdIndexSql = `CREATE INDEX IF NOT EXISTS build_characters_guild_created_idx
  ON build_characters (guild_id, created_at)`;

export async function ensureBuildCharactersSchema(
  db: D1Database,
  guildId: string,
): Promise<void> {
  await ensureAuthSchema(db);

  if (!initialization) {
    initialization = db
      .batch([
        db.prepare(tableSql),
        db.prepare(nameIndexSql),
        db.prepare(createdIndexSql),
      ])
      .then(() => undefined)
      .catch((error: unknown) => {
        initialization = null;
        throw error;
      });
  }

  await initialization;

  let seeded = seededGuilds.get(guildId);
  if (!seeded) {
    seeded = seedDefaultCharacters(db, guildId).catch(
      (error: unknown) => {
        seededGuilds.delete(guildId);
        throw error;
      },
    );
    seededGuilds.set(guildId, seeded);
  }
  await seeded;
}

async function seedDefaultCharacters(
  db: D1Database,
  guildId: string,
): Promise<void> {
  const existing = await db
    .prepare(
      `SELECT name
       FROM build_characters
       WHERE guild_id = ?`,
    )
    .bind(guildId)
    .all<{ name: string }>();
  const existingNames = new Set(
    existing.results.map((character) => character.name),
  );
  const missingDefaults = buildCharacterClasses
    .map((name, index) => ({ name, index }))
    .filter(({ name }) => !existingNames.has(name));
  if (missingDefaults.length === 0) {
    return;
  }

  await db.batch(
    missingDefaults.map(({ name, index }) =>
      db
        .prepare(
          `INSERT OR IGNORE INTO build_characters (
            id, guild_id, name, image_key, image_content_type,
            created_by_user_id, created_at, updated_at
          ) VALUES (?, ?, ?, NULL, NULL, NULL, ?, ?)`,
        )
        .bind(
          `default-character-${guildId}-${index + 1}`,
          guildId,
          name,
          index,
          index,
        ),
    ),
  );
}
