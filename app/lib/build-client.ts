import type {
  BuildCharacterClass,
  BuildCharacter,
  BuildCharacterSlot,
  BuildProfile,
  BuildSkill,
} from "@/domain/build/model";
import type { BuildSigil } from "@/domain/build/sigil-model";

interface BuildResponse {
  profile?: BuildProfile;
  characters?: BuildCharacter[];
  skills?: BuildSkill[];
  sigils?: BuildSigil[];
  error?: string;
}

export interface BuildBootstrap {
  profile: BuildProfile;
  characters: BuildCharacter[];
  skills: BuildSkill[];
  sigils: BuildSigil[];
}

interface BuildSkillsResponse {
  skills?: BuildSkill[];
  skill?: BuildSkill;
  error?: string;
}

interface BuildCharactersResponse {
  characters?: BuildCharacter[];
  character?: BuildCharacter;
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

async function parseBootstrap(
  response: Response,
): Promise<BuildBootstrap> {
  const payload = (await response.json()) as BuildResponse;
  if (!response.ok) {
    throw new Error(payload.error ?? "Не удалось загрузить билд.");
  }
  if (!payload.profile) {
    throw new Error("Сервер не вернул профиль билда.");
  }
  return {
    profile: payload.profile,
    characters: payload.characters ?? [],
    skills: payload.skills ?? [],
    sigils: payload.sigils ?? [],
  };
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

  async getBootstrap(signal?: AbortSignal): Promise<BuildBootstrap> {
    return parseBootstrap(
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

  async listCharacters(signal?: AbortSignal): Promise<BuildCharacter[]> {
    const response = await fetch("/api/build/characters", {
      cache: "no-store",
      signal,
    });
    const payload = (await response.json()) as BuildCharactersResponse;
    if (!response.ok) {
      throw new Error(
        payload.error ?? "Не удалось загрузить каталог персонажей.",
      );
    }
    return payload.characters ?? [];
  }

  async createCharacter(formData: FormData): Promise<BuildCharacter> {
    const response = await fetch("/api/build/characters", {
      method: "POST",
      body: formData,
    });
    const payload = (await response.json()) as BuildCharactersResponse;
    if (!response.ok) {
      throw new Error(payload.error ?? "Не удалось добавить персонажа.");
    }
    if (!payload.character) {
      throw new Error("Сервер не вернул нового персонажа.");
    }
    return payload.character;
  }

  async updateCharacterImage(
    id: string,
    image: File,
  ): Promise<BuildCharacter> {
    const formData = new FormData();
    formData.set("image", image);
    const response = await fetch(
      `/api/build/characters?id=${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: formData,
      },
    );
    const payload = (await response.json()) as BuildCharactersResponse;
    if (!response.ok) {
      throw new Error(
        payload.error ?? "Не удалось обновить изображение персонажа.",
      );
    }
    if (!payload.character) {
      throw new Error("Сервер не вернул персонажа.");
    }
    return payload.character;
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
