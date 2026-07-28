import type { PlannerTaskRepository } from "@/domain/planner/ports";
import {
  validatePlannerDate,
  validatePlannerWeekStart,
} from "@/domain/planner/validation";

export class ListPlannerTasks {
  constructor(private readonly tasks: PlannerTaskRepository) {}

  async execute(
    userId: string,
    dailyPeriodInput: unknown,
    weeklyPeriodInput: unknown,
  ) {
    const dailyPeriod = validatePlannerDate(dailyPeriodInput);
    const weeklyPeriod = validatePlannerWeekStart(weeklyPeriodInput);
    return this.tasks.list(
      userId,
      dailyPeriod,
      weeklyPeriod,
    );
  }
}
