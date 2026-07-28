import { PlannerError } from "@/domain/planner/errors";
import type { AuthUser } from "@/domain/auth/model";
import { canManageGuildPlanner } from "@/domain/planner/permissions";
import type { PlannerTaskRepository } from "@/domain/planner/ports";
import { validatePlannerTaskId } from "@/domain/planner/validation";

export class DeletePlannerTask {
  constructor(private readonly tasks: PlannerTaskRepository) {}

  async execute(user: AuthUser, taskIdInput: unknown): Promise<void> {
    const taskId = validatePlannerTaskId(taskIdInput);
    const deleted = await this.tasks.delete(
      user.id,
      user.guildId,
      canManageGuildPlanner(user.role),
      taskId,
    );

    if (!deleted) {
      throw new PlannerError("NOT_FOUND", "Задача не найдена.");
    }
  }
}
