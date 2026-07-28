import type { PlannerTask } from "@/domain/planner/model";
import type { PlannerTaskRepository } from "@/domain/planner/ports";
import { getD1 } from "@/infrastructure/db/d1";
import { ensurePlannerSchema } from "@/infrastructure/db/ensure-planner-schema";

interface PlannerTaskRow {
  id: string;
  kind: "weekly" | "daily";
  title: string;
  scheduled_date: string;
  completed: number;
  completed_at: number | null;
  created_at: number;
  updated_at: number;
}

function mapTask(row: PlannerTaskRow): PlannerTask {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    scheduledDate: row.scheduled_date,
    completed: Boolean(row.completed),
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class D1PlannerTaskRepository implements PlannerTaskRepository {
  async listForWeek(
    userId: string,
    weekStart: string,
    weekEnd: string,
  ): Promise<PlannerTask[]> {
    const db = getD1();
    await ensurePlannerSchema(db);

    const rows = await db
      .prepare(
        `SELECT
          id,
          kind,
          title,
          scheduled_date,
          completed,
          completed_at,
          created_at,
          updated_at
        FROM planner_tasks
        WHERE user_id = ?
          AND (
            (kind = 'weekly' AND scheduled_date = ?)
            OR
            (kind = 'daily' AND scheduled_date BETWEEN ? AND ?)
          )
        ORDER BY
          completed ASC,
          scheduled_date ASC,
          created_at ASC`,
      )
      .bind(userId, weekStart, weekStart, weekEnd)
      .all<PlannerTaskRow>();

    return rows.results.map(mapTask);
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
          completed,
          completed_at,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, 0, NULL, ?, ?)`,
      )
      .bind(
        task.id,
        task.userId,
        task.kind,
        task.title,
        task.scheduledDate,
        task.createdAt,
        task.updatedAt,
      )
      .run();

    return {
      id: task.id,
      kind: task.kind,
      title: task.title,
      scheduledDate: task.scheduledDate,
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
    completedAt: number | null,
    updatedAt: number,
  ): Promise<PlannerTask | null> {
    const db = getD1();
    await ensurePlannerSchema(db);

    const result = await db
      .prepare(
        `UPDATE planner_tasks
         SET completed = ?, completed_at = ?, updated_at = ?
         WHERE id = ? AND user_id = ?`,
      )
      .bind(completed ? 1 : 0, completedAt, updatedAt, taskId, userId)
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
          scheduled_date,
          completed,
          completed_at,
          created_at,
          updated_at
         FROM planner_tasks
         WHERE id = ? AND user_id = ?
         LIMIT 1`,
      )
      .bind(taskId, userId)
      .first<PlannerTaskRow>();

    return row ? mapTask(row) : null;
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
