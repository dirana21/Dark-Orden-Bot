export type PlannerTaskKind = "monthly" | "weekly" | "daily";
export type PlannerTaskScope = "guild" | "personal";

export interface PlannerTask {
  id: string;
  kind: PlannerTaskKind;
  scope: PlannerTaskScope;
  title: string;
  completed: boolean;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
}
