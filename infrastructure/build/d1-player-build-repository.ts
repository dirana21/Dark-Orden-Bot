import type { BuildCharacterClass } from "@/domain/build/model";
import type {
  CommunityBuildAuthor,
  PlayerBuildLoadout,
  PlayerBuildSetupType,
  PlayerBuildSlot,
} from "@/domain/build/player-build-model";
import { getD1 } from "@/infrastructure/db/d1";

interface PlayerBuildRow {
  character?: BuildCharacterClass;
  setup_type?: PlayerBuildSetupType;
  slots_json: string;
  updated_at: number;
}

interface CommunityBuildRow extends PlayerBuildRow {
  user_id: string;
  display_name: string;
  role: string;
  discord_user_id: string | null;
  discord_avatar_hash: string | null;
  main_character: BuildCharacterClass | null;
  mirror_character: BuildCharacterClass | null;
}

function parseSlots(value: string): PlayerBuildSlot[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter(
        (slot): slot is {
          skillId: string;
          sigilIds: unknown[];
          comboEnabled?: unknown;
          alternateEnabled?: unknown;
        } =>
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
        comboEnabled:
          typeof slot.comboEnabled === "boolean"
            ? slot.comboEnabled
            : null,
        alternateEnabled: slot.alternateEnabled === true,
      }));
  } catch {
    return [];
  }
}

export class D1PlayerBuildRepository {
  async get(
    userId: string,
    character: BuildCharacterClass,
    setupType: PlayerBuildSetupType,
  ): Promise<PlayerBuildLoadout> {
    const row = await getD1()
      .prepare(
        `SELECT slots_json, updated_at
         FROM user_build_loadouts
         WHERE user_id = ? AND character = ? AND setup_type = ?
         LIMIT 1`,
      )
      .bind(userId, character, setupType)
      .first<PlayerBuildRow>();

    return {
      character,
      setupType,
      slots: row ? parseSlots(row.slots_json) : [],
      updatedAt: row?.updated_at ?? null,
    };
  }

  async save(input: {
    userId: string;
    character: BuildCharacterClass;
    setupType: PlayerBuildSetupType;
    slots: PlayerBuildSlot[];
    now: number;
  }): Promise<PlayerBuildLoadout> {
    await getD1()
      .prepare(
        `INSERT INTO user_build_loadouts (
          user_id, character, setup_type, slots_json, updated_at
        ) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id, character, setup_type) DO UPDATE SET
          slots_json = excluded.slots_json,
          updated_at = excluded.updated_at`,
      )
      .bind(
        input.userId,
        input.character,
        input.setupType,
        JSON.stringify(input.slots),
        input.now,
      )
      .run();

    return {
      character: input.character,
      setupType: input.setupType,
      slots: input.slots,
      updatedAt: input.now,
    };
  }

  async listCommunity(
    guildId: string,
  ): Promise<CommunityBuildAuthor[]> {
    const rows = await getD1()
      .prepare(
        `SELECT
          loadouts.user_id,
          loadouts.character,
          loadouts.setup_type,
          loadouts.slots_json,
          loadouts.updated_at,
          users.display_name,
          users.role,
          users.discord_user_id,
          users.discord_avatar_hash,
          profiles.main_character,
          profiles.mirror_character
        FROM user_build_loadouts AS loadouts
        INNER JOIN users ON users.id = loadouts.user_id
        LEFT JOIN user_build_profiles AS profiles
          ON profiles.user_id = loadouts.user_id
        WHERE users.guild_id = ?
          AND users.is_hidden = 0
          AND loadouts.slots_json <> '[]'
        ORDER BY loadouts.updated_at DESC`,
      )
      .bind(guildId)
      .all<CommunityBuildRow>();

    const authors = new Map<string, CommunityBuildAuthor>();
    for (const row of rows.results) {
      if (!row.character || !row.setup_type) {
        continue;
      }
      let author = authors.get(row.user_id);
      if (!author) {
        author = {
          id: row.user_id,
          displayName: row.display_name,
          role: row.role,
          avatarUrl:
            row.discord_user_id && row.discord_avatar_hash
              ? `https://cdn.discordapp.com/avatars/${encodeURIComponent(row.discord_user_id)}/${encodeURIComponent(row.discord_avatar_hash)}.webp?size=128`
              : null,
          mainCharacter: row.main_character,
          mirrorCharacter: row.mirror_character,
          loadouts: [],
        };
        authors.set(row.user_id, author);
      }
      author.loadouts.push({
        character: row.character,
        setupType: row.setup_type,
        slots: parseSlots(row.slots_json),
        updatedAt: row.updated_at,
      });
    }
    return [...authors.values()];
  }
}
