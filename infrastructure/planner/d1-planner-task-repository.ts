import type { PlannerTask } from "@/domain/planner/model";
import type { PlannerTaskRepository } from "@/domain/planner/ports";
import { isPlannerCompletionCurrent } from "@/domain/planner/recurrence";
import { getD1 } from "@/infrastructure/db/d1";
import { ensurePlannerSchema } from "@/infrastructure/db/ensure-planner-schema";

interface PlannerTaskRow {
  id: string;
  kind: "weekly" | "daily";
  title: string;
  completion_period: string | null;
  completed_at: number | null;
  created_at: number;
  updated_at: number;
}

function mapTask(
  row: PlannerTaskRow,
  dailyPeriod: string,
  weeklyPeriod: string,
): PlannerTask {
  const completed = isPlannerCompletionCurrent(
    row.kind,
    row.completion_period,
    dailyPeriod,
    weeklyPeriod,
  );

  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    completed,
    completedAt: completed ? row.completed_at : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class D1PlannerTaskRepository implements PlannerTaskRepository {
  async list(
    userId: string,
    dailyPeriod: string,
    weeklyPeriod: string,
  ): Promise<PlannerTask[]> {
    const db = getD1();
    await ensurePlannerSchema(db);

    const rows = await db
      .prepare(
        `SELECT
          id,
          kind,
          title,
          completion_period,
          completed_at,
          created_at,
          updated_at
        FROM planner_tasks
        WHERE user_id = ?
        ORDER BY
          kind ASC,
          created_at ASC`,
      )
      .bind(userId)
      .all<PlannerTaskRow>();

    return rows.results
      .map((row) => mapTask(row, dailyPeriod, weeklyPeriod))
      .sort(
        (left, right) =>
          Number(left.completed) - Number(right.completed) ||
          left.createdAt - right.createdAt,
      );
  }

  async create(
    task: PlannerTask & { userId: string },
  ): Promise<PlannerTask> {
    const db = getD1();
    await ensurePlannerSchema(db);

    await db
      .prepare(
        `INSERT INTO planner_tasks (
          id,
          user_id,
          kind,
          title,
          scheduled_date,
          completion_period,
          completed,
          completed_at,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, '', NULL, 0, NULL, ?, ?)`,
      )
      .bind(
        task.id,
        task.userId,
        task.kind,
        task.title,
        task.createdAt,
        task.updatedAt,
      )
      .run();

    return {
      id: task.id,
      kind: task.kind,
      title: task.title,
      completed: task.completed,
      completedAt: task.completedAt,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  async setCompleted(
    userId: string,
    taskId: string,
    completed: boolean,
    dailyPeriod: string,
    weeklyPeriod: string,
    completedAt: number | null,
    updatedAt: number,
  ): Promise<PlannerTask | null> {
    const db = getD1();
    await ensurePlannerSchema(db);

    const result = await db
      .prepare(
        `UPDATE planner_tasks
         SET
           completed = ?,
           completed_at = ?,
           completion_period = CASE
             WHEN ? = 0 THEN NULL
             WHEN kind = 'daily' THEN ?
             ELSE ?
           END,
           updated_at = ?
         WHERE id = ? AND user_id = ?`,
      )
      .bind(
        completed ? 1 : 0,
        completedAt,
        completed ? 1 : 0,
        dailyPeriod,
        weeklyPeriod,
        updatedAt,
        taskId,
        userId,
      )
      .run();

    if (result.meta.changes < 1) {
      return null;
    }

    const row = await db
      .prepare(
        `SELECT
          id,
          kind,
          title,
          completion_period,
          completed_at,
          created_at,
          updated_at
         FROM planner_tasks
         WHERE id = ? AND user_id = ?
         LIMIT 1`,
      )
      .bind(taskId, userId)
      .first<PlannerTaskRow>();

    return row ? mapTask(row, dailyPeriod, weeklyPeriod) : null;
  }

  async delete(userId: string, taskId: string): Promise<boolean> {
    const db = getD1();
    await ensurePlannerSchema(db);

    const result = await db
      .prepare("DELETE FROM planner_tasks WHERE id = ? AND user_id = ?")
      .bind(taskId, userId)
      .run();

    return result.meta.changes > 0;
  }
}
