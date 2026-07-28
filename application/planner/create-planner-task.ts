import type { Clock, IdGenerator } from "@/domain/auth/ports";
import { PlannerError } from "@/domain/planner/errors";
import type { PlannerTaskRepository } from "@/domain/planner/ports";
import {
  validatePlannerTaskKind,
  validatePlannerTaskTitle,
} from "@/domain/planner/validation";

export class CreatePlannerTask {
  constructor(
    private readonly tasks: PlannerTaskRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(
    userId: string,
    input: {
      kind?: unknown;
      title?: unknown;
    },
  ) {
    const kind = validatePlannerTaskKind(input.kind);
    const title = validatePlannerTaskTitle(input.title);

    if (!userId) {
      throw new PlannerError("INVALID_INPUT", "Не удалось определить аккаунт.");
    }

    const now = this.clock.now();
    return this.tasks.create({
      id: this.ids.generate(),
      userId,
      kind,
      title,
      completed: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }
}
