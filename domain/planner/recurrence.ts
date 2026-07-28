import type { PlannerTaskKind } from "./model";

export function isPlannerCompletionCurrent(
  kind: PlannerTaskKind,
  completionPeriod: string | null,
  dailyPeriod: string,
  weeklyPeriod: string,
  monthlyPeriod: string,
): boolean {
  const currentPeriod =
    kind === "daily"
      ? dailyPeriod
      : kind === "weekly"
        ? weeklyPeriod
        : monthlyPeriod;

  return completionPeriod === currentPeriod;
}
