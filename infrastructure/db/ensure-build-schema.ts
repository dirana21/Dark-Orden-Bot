import { ensureAuthSchema } from "./ensure-auth-schema";

let initialization: Promise<void> | null = null;

const schemaSql = `CREATE TABLE IF NOT EXISTS user_build_profiles (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  main_character TEXT,
  mirror_character TEXT,
  updated_at INTEGER NOT NULL
)`;

export async function ensureBuildSchema(db: D1Database): Promise<void> {
  await ensureAuthSchema(db);

  if (!initialization) {
    initialization = db
      .prepare(schemaSql)
      .run()
      .then(() => undefined)
      .catch((error: unknown) => {
        initialization = null;
        throw error;
      });
  }

  await initialization;
}
