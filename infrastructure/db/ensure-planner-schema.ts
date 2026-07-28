import { ensureAuthSchema } from "./ensure-auth-schema";

let initialization: Promise<void> | null = null;

const statements = [
  `CREATE TABLE IF NOT EXISTS planner_tasks (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    scheduled_date TEXT NOT NULL,
    completion_period TEXT,
    completed INTEGER NOT NULL DEFAULT 0,
    completed_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS planner_tasks_user_schedule_idx
   ON planner_tasks(user_id, scheduled_date, kind)`,
  `CREATE TABLE IF NOT EXISTS guild_planner_tasks (
    id TEXT PRIMARY KEY NOT NULL,
    guild_id TEXT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    created_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS guild_planner_tasks_guild_kind_idx
   ON guild_planner_tasks(guild_id, kind, created_at)`,
  `CREATE TABLE IF NOT EXISTS guild_planner_task_completions (
    task_id TEXT NOT NULL REFERENCES guild_planner_tasks(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    completion_period TEXT NOT NULL,
    completed_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (task_id, user_id)
  )`,
  `CREATE INDEX IF NOT EXISTS guild_planner_task_completions_user_idx
   ON guild_planner_task_completions(user_id, completion_period)`,
];

export async function ensurePlannerSchema(db: D1Database): Promise<void> {
  await ensureAuthSchema(db);

  if (!initialization) {
    initialization = db
      .batch(statements.map((statement) => db.prepare(statement)))
      .then(async () => {
        const columns = await db
          .prepare("PRAGMA table_info(planner_tasks)")
          .all<{ name: string }>();

        if (
          !columns.results.some(
            (column) => column.name === "completion_period",
          )
        ) {
          await db
            .prepare(
              "ALTER TABLE planner_tasks ADD COLUMN completion_period TEXT",
            )
            .run();
        }
      })
      .catch((error: unknown) => {
        initialization = null;
        throw error;
      });
  }

  await initialization;
}
