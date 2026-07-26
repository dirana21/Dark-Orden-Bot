import type { BlackSunStanding } from "@/domain/black-sun/model";
import type {
  EventRole,
  EventSessionNumber,
} from "@/domain/events/model";

interface BlackSunResponse {
  standings?: BlackSunStanding[];
  error?: string;
}

async function parse(response: Response): Promise<BlackSunStanding[]> {
  const payload = (await response.json()) as BlackSunResponse;
  if (!response.ok) {
    throw new Error(payload.error ?? "Не удалось загрузить рейтинг.");
  }
  return payload.standings ?? [];
}

export class HttpBlackSunGateway {
  async list(sessionNumber: EventSessionNumber): Promise<BlackSunStanding[]> {
    return parse(
      await fetch(`/api/black-sun?session=${sessionNumber}`, {
        cache: "no-store",
      }),
    );
  }

  async submit(
    sessionNumber: EventSessionNumber,
    points: number,
  ): Promise<BlackSunStanding[]> {
    return parse(
      await fetch(`/api/black-sun?session=${sessionNumber}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points }),
      }),
    );
  }

  async selectRole(
    sessionNumber: EventSessionNumber,
    role: EventRole,
  ): Promise<BlackSunStanding[]> {
    return parse(
      await fetch(`/api/black-sun?session=${sessionNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      }),
    );
  }
}
