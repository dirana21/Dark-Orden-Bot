export type PlannerTaskKind = "monthly" | "weekly" | "daily";

export interface PlannerTask {
  id: string;
  kind: PlannerTaskKind;
  title: string;
  completed: boolean;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
}
