import type {
  PlannerTask,
  PlannerTaskKind,
  PlannerTaskScope,
} from "./model";

export interface PlannerTaskRepository {
  list(
    userId: string,
    guildId: string,
    dailyPeriod: string,
    weeklyPeriod: string,
    monthlyPeriod: string,
  ): Promise<PlannerTask[]>;
  create(
    task: PlannerTask & { userId: string; guildId: string },
  ): Promise<PlannerTask>;
  setCompleted(
    userId: string,
    guildId: string,
    taskId: string,
    completed: boolean,
    dailyPeriod: string,
    weeklyPeriod: string,
    monthlyPeriod: string,
    completedAt: number | null,
    updatedAt: number,
  ): Promise<PlannerTask | null>;
  delete(
    userId: string,
    guildId: string,
    canManageGuildTasks: boolean,
    taskId: string,
  ): Promise<boolean>;
}

export interface CreatePlannerTaskInput {
  kind: PlannerTaskKind;
  scope: PlannerTaskScope;
  title: string;
}
