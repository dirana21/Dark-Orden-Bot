import type { PlannerTask } from "@/domain/planner/model";
import type { PlannerTaskRepository } from "@/domain/planner/ports";
import { isPlannerCompletionCurrent } from "@/domain/planner/recurrence";
import { getD1 } from "@/infrastructure/db/d1";
import { ensurePlannerSchema } from "@/infrastructure/db/ensure-planner-schema";

interface PlannerTaskRow {
  id: string;
  kind: "monthly" | "weekly" | "daily";
  title: string;
  completion_period: string | null;
  completed_at: number | null;
  created_at: number;
  updated_at: number;
}

function mapTask(
  row: PlannerTaskRow,
  scope: PlannerTask["scope"],
  dailyPeriod: string,
  weeklyPeriod: string,
  monthlyPeriod: string,
): PlannerTask {
  const completed = isPlannerCompletionCurrent(
    row.kind,
    row.completion_period,
    dailyPeriod,
    weeklyPeriod,
    monthlyPeriod,
  );

  return {
    id: row.id,
    kind: row.kind,
    scope,
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
    guildId: string,
    dailyPeriod: string,
    weeklyPeriod: string,
    monthlyPeriod: string,
  ): Promise<PlannerTask[]> {
    const db = getD1();
    await ensurePlannerSchema(db);

    const personalRows = await db
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

    const guildRows = await db
      .prepare(
        `SELECT
          tasks.id,
          tasks.kind,
          tasks.title,
          completions.completion_period,
          completions.completed_at,
          tasks.created_at,
          tasks.updated_at
        FROM guild_planner_tasks AS tasks
        LEFT JOIN guild_planner_task_completions AS completions
          ON completions.task_id = tasks.id
          AND completions.user_id = ?
        WHERE tasks.guild_id = ?
        ORDER BY
          tasks.kind ASC,
          tasks.created_at ASC`,
      )
      .bind(userId, guildId)
      .all<PlannerTaskRow>();

    return [
      ...guildRows.results.map((row) =>
        mapTask(
          row,
          "guild",
          dailyPeriod,
          weeklyPeriod,
          monthlyPeriod,
        ),
      ),
      ...personalRows.results.map((row) =>
        mapTask(
          row,
          "personal",
          dailyPeriod,
          weeklyPeriod,
          monthlyPeriod,
        ),
      ),
    ]
      .sort(
        (left, right) =>
          Number(left.completed) - Number(right.completed) ||
          left.createdAt - right.createdAt,
      );
  }

  async create(
    task: PlannerTask & { userId: string; guildId: string },
  ): Promise<PlannerTask> {
    const db = getD1();
    await ensurePlannerSchema(db);

    if (task.scope === "guild") {
      await db
        .prepare(
          `INSERT INTO guild_planner_tasks (
            id,
            guild_id,
            created_by_user_id,
            kind,
            title,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          task.id,
          task.guildId,
          task.userId,
          task.kind,
          task.title,
          task.createdAt,
          task.updatedAt,
        )
        .run();
    } else {
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
    }

    return {
      id: task.id,
      kind: task.kind,
      scope: task.scope,
      title: task.title,
      completed: task.completed,
      completedAt: task.completedAt,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }

  async setCompleted(
    userId: string,
    guildId: string,
    taskId: string,
    completed: boolean,
    dailyPeriod: string,
    weeklyPeriod: string,
    monthlyPeriod: string,
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
             WHEN kind = 'weekly' THEN ?
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
        monthlyPeriod,
        updatedAt,
        taskId,
        userId,
      )
      .run();

    if (result.meta.changes > 0) {
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

      return row
        ? mapTask(
            row,
            "personal",
            dailyPeriod,
            weeklyPeriod,
            monthlyPeriod,
          )
        : null;
    }

    const guildRow = await db
      .prepare(
        `SELECT
          id,
          kind,
          title,
          NULL AS completion_period,
          NULL AS completed_at,
          created_at,
          updated_at
         FROM guild_planner_tasks
         WHERE id = ? AND guild_id = ?
         LIMIT 1`,
      )
      .bind(taskId, guildId)
      .first<PlannerTaskRow>();

    if (!guildRow) {
      return null;
    }

    const completionPeriod =
      guildRow.kind === "daily"
        ? dailyPeriod
        : guildRow.kind === "weekly"
          ? weeklyPeriod
          : monthlyPeriod;

    if (completed) {
      await db
        .prepare(
          `INSERT INTO guild_planner_task_completions (
            task_id,
            user_id,
            completion_period,
            completed_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(task_id, user_id) DO UPDATE SET
            completion_period = excluded.completion_period,
            completed_at = excluded.completed_at,
            updated_at = excluded.updated_at`,
        )
        .bind(
          taskId,
          userId,
          completionPeriod,
          completedAt ?? updatedAt,
          updatedAt,
        )
        .run();
    } else {
      await db
        .prepare(
          `DELETE FROM guild_planner_task_completions
           WHERE task_id = ? AND user_id = ?`,
        )
        .bind(taskId, userId)
        .run();
    }

    return mapTask(
      {
        ...guildRow,
        completion_period: completed ? completionPeriod : null,
        completed_at: completed ? (completedAt ?? updatedAt) : null,
      },
      "guild",
      dailyPeriod,
      weeklyPeriod,
      monthlyPeriod,
    );
  }

  async delete(
    userId: string,
    guildId: string,
    canManageGuildTasks: boolean,
    taskId: string,
  ): Promise<boolean> {
    const db = getD1();
    await ensurePlannerSchema(db);

    const result = await db
      .prepare("DELETE FROM planner_tasks WHERE id = ? AND user_id = ?")
      .bind(taskId, userId)
      .run();

    if (result.meta.changes > 0) {
      return true;
    }

    if (!canManageGuildTasks) {
      return false;
    }

    const guildResult = await db
      .prepare(
        "DELETE FROM guild_planner_tasks WHERE id = ? AND guild_id = ?",
      )
      .bind(taskId, guildId)
      .run();

    return guildResult.meta.changes > 0;
  }
}
