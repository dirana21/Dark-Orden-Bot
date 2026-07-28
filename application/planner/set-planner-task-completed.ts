import type { Clock } from "@/domain/auth/ports";
import { PlannerError } from "@/domain/planner/errors";
import type { PlannerTaskRepository } from "@/domain/planner/ports";
import {
  validatePlannerCompleted,
  validatePlannerDate,
  validatePlannerTaskId,
  validatePlannerWeekStart,
} from "@/domain/planner/validation";

export class SetPlannerTaskCompleted {
  constructor(
    private readonly tasks: PlannerTaskRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    userId: string,
    taskIdInput: unknown,
    completedInput: unknown,
    dailyPeriodInput: unknown,
    weeklyPeriodInput: unknown,
  ) {
    const taskId = validatePlannerTaskId(taskIdInput);
    const completed = validatePlannerCompleted(completedInput);
    const dailyPeriod = validatePlannerDate(dailyPeriodInput);
    const weeklyPeriod = validatePlannerWeekStart(weeklyPeriodInput);
    const now = this.clock.now();
    const task = await this.tasks.setCompleted(
      userId,
      taskId,
      completed,
      dailyPeriod,
      weeklyPeriod,
      completed ? now : null,
      now,
    );

    if (!task) {
      throw new PlannerError("NOT_FOUND", "Задача не найдена.");
    }

    return task;
  }
}
