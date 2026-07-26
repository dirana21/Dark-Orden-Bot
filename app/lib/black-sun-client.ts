import type { BlackSunStanding } from "@/domain/black-sun/model";

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
  async list(): Promise<BlackSunStanding[]> {
    return parse(await fetch("/api/black-sun", { cache: "no-store" }));
  }

  async submit(points: number): Promise<BlackSunStanding[]> {
    return parse(
      await fetch("/api/black-sun", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points }),
      }),
    );
  }
}
