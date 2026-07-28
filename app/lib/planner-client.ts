import type { PlannerTask, PlannerTaskKind } from "@/domain/planner/model";

interface PlannerResponse {
  tasks?: PlannerTask[];
  task?: PlannerTask;
  success?: boolean;
  error?: string;
}

async function parse(response: Response): Promise<PlannerResponse> {
  const payload = (await response.json()) as PlannerResponse;
  if (!response.ok) {
    throw new Error(payload.error ?? "Не удалось обновить личный план.");
  }
  return payload;
}

export class HttpPlannerGateway {
  async list(weekStart: string, signal?: AbortSignal): Promise<PlannerTask[]> {
    const payload = await parse(
      await fetch(`/api/planner?week=${encodeURIComponent(weekStart)}`, {
        cache: "no-store",
        signal,
      }),
    );
    return payload.tasks ?? [];
  }

  async create(input: {
    kind: PlannerTaskKind;
    title: string;
    scheduledDate: string;
  }): Promise<PlannerTask> {
    const payload = await parse(
      await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    );
    if (!payload.task) {
      throw new Error("Сервер не вернул созданную задачу.");
    }
    return payload.task;
  }

  async setCompleted(id: string, completed: boolean): Promise<PlannerTask> {
    const payload = await parse(
      await fetch("/api/planner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, completed }),
      }),
    );
    if (!payload.task) {
      throw new Error("Сервер не вернул обновлённую задачу.");
    }
    return payload.task;
  }

  async delete(id: string): Promise<void> {
    await parse(
      await fetch(`/api/planner?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      }),
    );
  }
}
