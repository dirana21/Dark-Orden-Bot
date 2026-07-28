import { PlannerError } from "@/domain/planner/errors";
import type { PlannerTaskRepository } from "@/domain/planner/ports";
import { validatePlannerTaskId } from "@/domain/planner/validation";

export class DeletePlannerTask {
  constructor(private readonly tasks: PlannerTaskRepository) {}

  async execute(userId: string, taskIdInput: unknown): Promise<void> {
    const taskId = validatePlannerTaskId(taskIdInput);
    const deleted = await this.tasks.delete(userId, taskId);

    if (!deleted) {
      throw new PlannerError("NOT_FOUND", "Задача не найдена.");
    }
  }
}
