import type { BuildCharacterClass } from "@/domain/build/model";
import type {
  PlayerBuildLoadout,
  PlayerBuildSlot,
} from "@/domain/build/player-build-model";
import { getD1 } from "@/infrastructure/db/d1";

interface PlayerBuildRow {
  slots_json: string;
  updated_at: number;
}

function parseSlots(value: string): PlayerBuildSlot[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter(
        (slot): slot is { skillId: string; sigilIds: unknown[] } =>
          Boolean(
            slot &&
              typeof slot === "object" &&
              typeof (slot as { skillId?: unknown }).skillId ===
                "string" &&
              Array.isArray(
                (slot as { sigilIds?: unknown }).sigilIds,
              ),
          ),
      )
      .slice(0, 10)
      .map((slot) => ({
        skillId: slot.skillId,
        sigilIds: slot.sigilIds.slice(0, 4).map((sigilId) =>
          typeof sigilId === "string" ? sigilId : null,
        ),
      }));
  } catch {
    return [];
  }
}

export class D1PlayerBuildRepository {
  async get(
    userId: string,
    character: BuildCharacterClass,
  ): Promise<PlayerBuildLoadout> {
    const row = await getD1()
      .prepare(
        `SELECT slots_json, updated_at
         FROM user_build_loadouts
         WHERE user_id = ? AND character = ?
         LIMIT 1`,
      )
      .bind(userId, character)
      .first<PlayerBuildRow>();

    return {
      character,
      slots: row ? parseSlots(row.slots_json) : [],
      updatedAt: row?.updated_at ?? null,
    };
  }

  async save(input: {
    userId: string;
    character: BuildCharacterClass;
    slots: PlayerBuildSlot[];
    now: number;
  }): Promise<PlayerBuildLoadout> {
    await getD1()
      .prepare(
        `INSERT INTO user_build_loadouts (
          user_id, character, slots_json, updated_at
        ) VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, character) DO UPDATE SET
          slots_json = excluded.slots_json,
          updated_at = excluded.updated_at`,
      )
      .bind(
        input.userId,
        input.character,
        JSON.stringify(input.slots),
        input.now,
      )
      .run();

    return {
      character: input.character,
      slots: input.slots,
      updatedAt: input.now,
    };
  }
}
