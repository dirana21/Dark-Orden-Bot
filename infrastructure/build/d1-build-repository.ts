import type {
  BuildCharacterClass,
  BuildCharacterSlot,
  BuildProfile,
} from "@/domain/build/model";
import { getD1 } from "@/infrastructure/db/d1";
import { ensureBuildSchema } from "@/infrastructure/db/ensure-build-schema";

interface BuildProfileRow {
  main_character: BuildCharacterClass | null;
  mirror_character: BuildCharacterClass | null;
  updated_at: number;
}

function mapProfile(row: BuildProfileRow | null): BuildProfile {
  return {
    mainCharacter: row?.main_character ?? null,
    mirrorCharacter: row?.mirror_character ?? null,
    updatedAt: row?.updated_at ?? null,
  };
}

export class D1BuildRepository {
  async get(userId: string): Promise<BuildProfile> {
    const db = getD1();

    const row = await db
      .prepare(
        `SELECT main_character, mirror_character, updated_at
         FROM user_build_profiles
         WHERE user_id = ?
         LIMIT 1`,
      )
      .bind(userId)
      .first<BuildProfileRow>();

    return mapProfile(row);
  }

  async setCharacter(
    userId: string,
    slot: BuildCharacterSlot,
    character: BuildCharacterClass,
    updatedAt: number,
  ): Promise<BuildProfile> {
    const db = getD1();
    await ensureBuildSchema(db);
    const column =
      slot === "main" ? "main_character" : "mirror_character";

    await db.batch([
      db
        .prepare(
          `INSERT INTO user_build_profiles (
            user_id,
            main_character,
            mirror_character,
            updated_at
          ) VALUES (?, NULL, NULL, ?)
          ON CONFLICT(user_id) DO NOTHING`,
        )
        .bind(userId, updatedAt),
      db
        .prepare(
          `UPDATE user_build_profiles
           SET ${column} = ?, updated_at = ?
           WHERE user_id = ?`,
        )
        .bind(character, updatedAt, userId),
    ]);

    return this.get(userId);
  }
}
