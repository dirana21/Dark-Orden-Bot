import type { PlannerTaskKind } from "./model";

export function isPlannerCompletionCurrent(
  kind: PlannerTaskKind,
  completionPeriod: string | null,
  dailyPeriod: string,
  weeklyPeriod: string,
): boolean {
  return (
    completionPeriod ===
    (kind === "daily" ? dailyPeriod : weeklyPeriod)
  );
}
