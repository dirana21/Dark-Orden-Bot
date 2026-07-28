import type { PlannerTaskRepository } from "@/domain/planner/ports";
import {
  addPlannerDays,
  validatePlannerWeekStart,
} from "@/domain/planner/validation";

export class ListPlannerTasks {
  constructor(private readonly tasks: PlannerTaskRepository) {}

  async execute(userId: string, weekStartInput: unknown) {
    const weekStart = validatePlannerWeekStart(weekStartInput);
    return this.tasks.listForWeek(
      userId,
      weekStart,
      addPlannerDays(weekStart, 6),
    );
  }
}
