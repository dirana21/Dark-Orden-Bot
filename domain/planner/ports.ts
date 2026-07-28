import type { PlannerTask, PlannerTaskKind } from "./model";

export interface PlannerTaskRepository {
  listForWeek(
    userId: string,
    weekStart: string,
    weekEnd: string,
  ): Promise<PlannerTask[]>;
  create(
    task: PlannerTask & { userId: string },
  ): Promise<PlannerTask>;
  setCompleted(
    userId: string,
    taskId: string,
    completed: boolean,
    completedAt: number | null,
    updatedAt: number,
  ): Promise<PlannerTask | null>;
  delete(userId: string, taskId: string): Promise<boolean>;
}

export interface CreatePlannerTaskInput {
  kind: PlannerTaskKind;
  title: string;
  scheduledDate: string;
}
