import type { VengefulSoulsStanding } from "@/domain/vengeful-souls/model";
import type {
  EventRole,
  EventSessionNumber,
} from "@/domain/events/model";

interface VengefulSoulsResponse {
  standings?: VengefulSoulsStanding[];
  error?: string;
}

async function parse(response: Response): Promise<VengefulSoulsStanding[]> {
  const payload = (await response.json()) as VengefulSoulsResponse;
  if (!response.ok) {
    throw new Error(payload.error ?? "Не удалось загрузить рейтинг.");
  }
  return payload.standings ?? [];
}

export class HttpVengefulSoulsGateway {
  async list(
    sessionNumber: EventSessionNumber,
  ): Promise<VengefulSoulsStanding[]> {
    return parse(
      await fetch(`/api/vengeful-souls?session=${sessionNumber}`, {
        cache: "no-store",
      }),
    );
  }

  async submit(
    sessionNumber: EventSessionNumber,
    points: number,
  ): Promise<VengefulSoulsStanding[]> {
    return parse(
      await fetch(`/api/vengeful-souls?session=${sessionNumber}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points }),
      }),
    );
  }

  async selectRole(
    sessionNumber: EventSessionNumber,
    role: EventRole,
  ): Promise<VengefulSoulsStanding[]> {
    return parse(
      await fetch(`/api/vengeful-souls?session=${sessionNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      }),
    );
  }
}
