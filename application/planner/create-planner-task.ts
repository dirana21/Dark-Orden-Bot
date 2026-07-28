import type { Clock, IdGenerator } from "@/domain/auth/ports";
import type { AuthUser } from "@/domain/auth/model";
import { PlannerError } from "@/domain/planner/errors";
import { canManageGuildPlanner } from "@/domain/planner/permissions";
import type { PlannerTaskRepository } from "@/domain/planner/ports";
import {
  validatePlannerTaskKind,
  validatePlannerTaskScope,
  validatePlannerTaskTitle,
} from "@/domain/planner/validation";

export class CreatePlannerTask {
  constructor(
    private readonly tasks: PlannerTaskRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(
    user: AuthUser,
    input: {
      kind?: unknown;
      scope?: unknown;
      title?: unknown;
    },
  ) {
    const kind = validatePlannerTaskKind(input.kind);
    const scope = validatePlannerTaskScope(input.scope);
    const title = validatePlannerTaskTitle(input.title);

    if (!user.id || !user.guildId) {
      throw new PlannerError("INVALID_INPUT", "Не удалось определить аккаунт.");
    }
    if (scope === "guild" && !canManageGuildPlanner(user.role)) {
      throw new PlannerError(
        "FORBIDDEN",
        "Только глава гильдии может добавлять общие задачи.",
      );
    }

    const now = this.clock.now();
    return this.tasks.create({
      id: this.ids.generate(),
      userId: user.id,
      guildId: user.guildId,
      kind,
      scope,
      title,
      completed: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }
}
