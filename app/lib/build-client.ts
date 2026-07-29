import type {
  BuildCharacterClass,
  BuildCharacterSlot,
  BuildProfile,
} from "@/domain/build/model";

interface BuildResponse {
  profile?: BuildProfile;
  error?: string;
}

async function parse(response: Response): Promise<BuildProfile> {
  const payload = (await response.json()) as BuildResponse;
  if (!response.ok) {
    throw new Error(payload.error ?? "Не удалось сохранить персонажа.");
  }
  if (!payload.profile) {
    throw new Error("Сервер не вернул профиль билда.");
  }
  return payload.profile;
}

export class HttpBuildGateway {
  async get(signal?: AbortSignal): Promise<BuildProfile> {
    return parse(
      await fetch("/api/build", {
        cache: "no-store",
        signal,
      }),
    );
  }

  async setCharacter(
    slot: BuildCharacterSlot,
    character: BuildCharacterClass,
  ): Promise<BuildProfile> {
    return parse(
      await fetch("/api/build", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot, character }),
      }),
    );
  }
}
