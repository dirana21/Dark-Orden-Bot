import { buildCharacterClasses } from "@/domain/build/model";

const seededGuilds = new Map<string, Promise<void>>();

export async function ensureBuildCharactersSchema(
  db: D1Database,
  guildId: string,
): Promise<void> {
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
