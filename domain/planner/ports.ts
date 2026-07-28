import type { PlannerTask, PlannerTaskKind } from "./model";

export interface PlannerTaskRepository {
  list(
    userId: string,
    dailyPeriod: string,
    weeklyPeriod: string,
    monthlyPeriod: string,
  ): Promise<PlannerTask[]>;
  create(
    task: PlannerTask & { userId: string },
  ): Promise<PlannerTask>;
  setCompleted(
    userId: string,
    taskId: string,
    completed: boolean,
    dailyPeriod: string,
    weeklyPeriod: string,
    monthlyPeriod: string,
    completedAt: number | null,
    updatedAt: number,
  ): Promise<PlannerTask | null>;
  delete(userId: string, taskId: string): Promise<boolean>;
}

export interface CreatePlannerTaskInput {
  kind: PlannerTaskKind;
  title: string;
}
