import { ensureAuthSchema } from "./ensure-auth-schema";

let initialization: Promise<void> | null = null;

const statements = [
  `CREATE TABLE IF NOT EXISTS black_sun_scores (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    guild_id TEXT NOT NULL REFERENCES guilds(id),
    session_number INTEGER NOT NULL,
    event_role TEXT,
    points INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER,
    PRIMARY KEY (user_id, session_number)
  )`,
  `CREATE INDEX IF NOT EXISTS black_sun_scores_guild_points_idx
   ON black_sun_scores(guild_id, session_number, points)`,
];

export async function ensureBlackSunSchema(db: D1Database): Promise<void> {
  await ensureAuthSchema(db);

  if (!initialization) {
    initialization = db
      .batch(statements.map((statement) => db.prepare(statement)))
      .then(() => undefined)
      .catch((error: unknown) => {
        initialization = null;
        throw error;
      });
  }

  await initialization;
}
