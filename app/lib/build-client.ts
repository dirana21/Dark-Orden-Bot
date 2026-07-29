import type {
  BuildCharacterClass,
  BuildCharacterSlot,
  BuildProfile,
  BuildSkill,
} from "@/domain/build/model";
import type { BuildSigil } from "@/domain/build/sigil-model";

interface BuildResponse {
  profile?: BuildProfile;
  error?: string;
}

interface BuildSkillsResponse {
  skills?: BuildSkill[];
  skill?: BuildSkill;
  error?: string;
}

interface BuildSigilsResponse {
  sigils?: BuildSigil[];
  sigil?: BuildSigil;
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

async function parseSkills(response: Response): Promise<BuildSkill[]> {
  const payload = (await response.json()) as BuildSkillsResponse;
  if (!response.ok) {
    throw new Error(payload.error ?? "Не удалось загрузить умения.");
  }
  return payload.skills ?? [];
}

export class HttpBuildSkillGateway {
  async list(
    character: BuildCharacterClass,
    signal?: AbortSignal,
  ): Promise<BuildSkill[]> {
    return parseSkills(
      await fetch(
        `/api/build/skills?character=${encodeURIComponent(character)}`,
        {
          cache: "no-store",
          signal,
        },
      ),
    );
  }

  async create(formData: FormData): Promise<BuildSkill> {
    const response = await fetch("/api/build/skills", {
      method: "POST",
      body: formData,
    });
    const payload = (await response.json()) as BuildSkillsResponse;
    if (!response.ok) {
      throw new Error(payload.error ?? "Не удалось добавить умение.");
    }
    if (!payload.skill) {
      throw new Error("Сервер не вернул добавленное умение.");
    }
    return payload.skill;
  }

  async update(id: string, formData: FormData): Promise<BuildSkill> {
    const response = await fetch(
      `/api/build/skills?id=${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: formData,
      },
    );
    const payload = (await response.json()) as BuildSkillsResponse;
    if (!response.ok) {
      throw new Error(payload.error ?? "Не удалось изменить умение.");
    }
    if (!payload.skill) {
      throw new Error("Сервер не вернул изменённое умение.");
    }
    return payload.skill;
  }

  async setCombo(id: string, enabled: boolean): Promise<BuildSkill> {
    const response = await fetch("/api/build/skill-combo", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillId: id, enabled }),
    });
    const payload = (await response.json()) as BuildSkillsResponse;
    if (!response.ok) {
      throw new Error(payload.error ?? "Не удалось изменить состояние комбо.");
    }
    if (!payload.skill) {
      throw new Error("Сервер не вернул состояние комбо.");
    }
    return payload.skill;
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(
      `/api/build/skills?id=${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    const payload = (await response.json()) as BuildSkillsResponse;
    if (!response.ok) {
      throw new Error(payload.error ?? "Не удалось удалить умение.");
    }
  }
}

export class HttpBuildSigilGateway {
  async list(signal?: AbortSignal): Promise<BuildSigil[]> {
    const response = await fetch("/api/build/sigils", {
      cache: "no-store",
      signal,
    });
    const payload = (await response.json()) as BuildSigilsResponse;
    if (!response.ok) {
      throw new Error(payload.error ?? "Не удалось загрузить сигилы.");
    }
    return payload.sigils ?? [];
  }

  async create(formData: FormData): Promise<BuildSigil> {
    const response = await fetch("/api/build/sigils", {
      method: "POST",
      body: formData,
    });
    const payload = (await response.json()) as BuildSigilsResponse;
    if (!response.ok) {
      throw new Error(payload.error ?? "Не удалось добавить сигил.");
    }
    if (!payload.sigil) {
      throw new Error("Сервер не вернул добавленный сигил.");
    }
    return payload.sigil;
  }

  async delete(id: string): Promise<void> {
    const response = await fetch(
      `/api/build/sigils?id=${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    const payload = (await response.json()) as BuildSigilsResponse;
    if (!response.ok) {
      throw new Error(payload.error ?? "Не удалось удалить сигил.");
    }
  }
}
