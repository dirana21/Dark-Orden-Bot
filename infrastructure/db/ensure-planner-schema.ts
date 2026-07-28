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
