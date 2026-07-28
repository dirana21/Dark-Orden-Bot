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
  async list(
    periods: { daily: string; weekly: string; monthly: string },
    signal?: AbortSignal,
  ): Promise<PlannerTask[]> {
    const params = new URLSearchParams({
      daily: periods.daily,
      weekly: periods.weekly,
      monthly: periods.monthly,
    });
    const payload = await parse(
      await fetch(`/api/planner?${params}`, {
        cache: "no-store",
        signal,
      }),
    );
    return payload.tasks ?? [];
  }

  async create(input: {
    kind: PlannerTaskKind;
    title: string;
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

  async setCompleted(
    id: string,
    completed: boolean,
    periods: { daily: string; weekly: string; monthly: string },
  ): Promise<PlannerTask> {
    const payload = await parse(
      await fetch("/api/planner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          completed,
          dailyPeriod: periods.daily,
          weeklyPeriod: periods.weekly,
          monthlyPeriod: periods.monthly,
        }),
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
