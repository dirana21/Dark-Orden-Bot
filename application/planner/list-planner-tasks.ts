import type { PlannerTaskRepository } from "@/domain/planner/ports";
import {
  validatePlannerDate,
  validatePlannerMonthStart,
  validatePlannerWeekStart,
} from "@/domain/planner/validation";

export class ListPlannerTasks {
  constructor(private readonly tasks: PlannerTaskRepository) {}

  async execute(
    userId: string,
    guildId: string,
    dailyPeriodInput: unknown,
    weeklyPeriodInput: unknown,
    monthlyPeriodInput: unknown,
  ) {
    const dailyPeriod = validatePlannerDate(dailyPeriodInput);
    const weeklyPeriod = validatePlannerWeekStart(weeklyPeriodInput);
    const monthlyPeriod = validatePlannerMonthStart(monthlyPeriodInput);
    return this.tasks.list(
      userId,
      guildId,
      dailyPeriod,
      weeklyPeriod,
      monthlyPeriod,
    );
  }
}
