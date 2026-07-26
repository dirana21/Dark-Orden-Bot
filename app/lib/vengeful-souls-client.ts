import type { VengefulSoulsStanding } from "@/domain/vengeful-souls/model";

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
  async list(): Promise<VengefulSoulsStanding[]> {
    return parse(
      await fetch("/api/vengeful-souls", { cache: "no-store" }),
    );
  }

  async submit(points: number): Promise<VengefulSoulsStanding[]> {
    return parse(
      await fetch("/api/vengeful-souls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points }),
      }),
    );
  }
}
