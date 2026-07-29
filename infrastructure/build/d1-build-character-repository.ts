import type {
  BuildCharacter,
  BuildCharacterClass,
} from "@/domain/build/model";
import { getD1 } from "@/infrastructure/db/d1";
import { ensureBuildCharactersSchema } from "@/infrastructure/db/ensure-build-characters-schema";

interface BuildCharacterRow {
  id: string;
  name: BuildCharacterClass;
  image_key: string | null;
  image_content_type: string | null;
  created_at: number;
  updated_at: number;
}

export interface StoredBuildCharacter extends BuildCharacter {
  imageKey: string | null;
  imageContentType: string | null;
}

function mapCharacter(row: BuildCharacterRow): StoredBuildCharacter {
  return {
    id: row.id,
    name: row.name,
    imageUrl: row.image_key
      ? `/api/build/character-image?id=${encodeURIComponent(row.id)}&v=${row.updated_at}`
      : null,
    imageKey: row.image_key,
    imageContentType: row.image_content_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function publicCharacter(
  character: StoredBuildCharacter,
): BuildCharacter {
  return {
    id: character.id,
    name: character.name,
    imageUrl: character.imageUrl,
    createdAt: character.createdAt,
    updatedAt: character.updatedAt,
  };
}

export class D1BuildCharacterRepository {
  async list(guildId: string): Promise<BuildCharacter[]> {
    const db = getD1();
    await ensureBuildCharactersSchema(db, guildId);
    const rows = await db
      .prepare(
        `SELECT id, name, image_key, image_content_type,
                created_at, updated_at
         FROM build_characters
         WHERE guild_id = ?
         ORDER BY created_at ASC, name ASC`,
      )
      .bind(guildId)
      .all<BuildCharacterRow>();

    return rows.results.map(mapCharacter);
  }

  async get(
    guildId: string,
    id: string,
  ): Promise<StoredBuildCharacter | null> {
    const db = getD1();
    await ensureBuildCharactersSchema(db, guildId);
    const row = await db
      .prepare(
        `SELECT id, name, image_key, image_content_type,
                created_at, updated_at
         FROM build_characters
         WHERE guild_id = ? AND id = ?
         LIMIT 1`,
      )
      .bind(guildId, id)
      .first<BuildCharacterRow>();

    return row ? mapCharacter(row) : null;
  }

  async findByName(
    guildId: string,
    name: string,
  ): Promise<StoredBuildCharacter | null> {
    const db = getD1();
    await ensureBuildCharactersSchema(db, guildId);
    const exact = await db
      .prepare(
        `SELECT id, name, image_key, image_content_type,
                created_at, updated_at
         FROM build_characters
         WHERE guild_id = ? AND name = ?
         LIMIT 1`,
      )
      .bind(guildId, name)
      .first<BuildCharacterRow>();
    if (exact) {
      return mapCharacter(exact);
    }

    const normalized = name.toLocaleLowerCase("ru");
    const characters = await this.list(guildId);
    const match = characters.find(
      (character) =>
        character.name.toLocaleLowerCase("ru") === normalized,
    );
    if (!match) {
      return null;
    }
    return this.get(guildId, match.id);
  }

  async create(input: {
    id: string;
    guildId: string;
    name: BuildCharacterClass;
    imageKey: string | null;
    imageContentType: string | null;
    createdByUserId: string;
    now: number;
  }): Promise<BuildCharacter> {
    const db = getD1();
    await ensureBuildCharactersSchema(db, input.guildId);
    await db
      .prepare(
        `INSERT INTO build_characters (
          id, guild_id, name, image_key, image_content_type,
          created_by_user_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        input.id,
        input.guildId,
        input.name,
        input.imageKey,
        input.imageContentType,
        input.createdByUserId,
        input.now,
        input.now,
      )
      .run();

    const created = await this.get(input.guildId, input.id);
    if (!created) {
      throw new Error("Created build character could not be loaded.");
    }
    return publicCharacter(created);
  }

  async updateImage(input: {
    guildId: string;
    id: string;
    imageKey: string;
    imageContentType: string;
    now: number;
  }): Promise<BuildCharacter | null> {
    const db = getD1();
    await ensureBuildCharactersSchema(db, input.guildId);
    const result = await db
      .prepare(
        `UPDATE build_characters
         SET image_key = ?, image_content_type = ?, updated_at = ?
         WHERE guild_id = ? AND id = ?`,
      )
      .bind(
        input.imageKey,
        input.imageContentType,
        input.now,
        input.guildId,
        input.id,
      )
      .run();

    if (!result.meta.changes) {
      return null;
    }
    const updated = await this.get(input.guildId, input.id);
    return updated ? publicCharacter(updated) : null;
  }
}
