import type {
  BuildSigil,
  BuildSigilCategory,
} from "@/domain/build/sigil-model";
import { getD1 } from "@/infrastructure/db/d1";
import { ensureBuildSigilsSchema } from "@/infrastructure/db/ensure-build-sigils-schema";

interface BuildSigilRow {
  id: string;
  name: string;
  category: BuildSigilCategory;
  description: string;
  icon_key: string;
  icon_content_type: string;
  created_at: number;
  updated_at: number;
}

export interface StoredBuildSigil extends BuildSigil {
  iconKey: string;
  iconContentType: string;
}

function mapSigil(row: BuildSigilRow): StoredBuildSigil {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    iconUrl: `/api/build/sigil-icon?id=${encodeURIComponent(row.id)}&v=${row.updated_at}`,
    iconKey: row.icon_key,
    iconContentType: row.icon_content_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function publicSigil(sigil: StoredBuildSigil): BuildSigil {
  return {
    id: sigil.id,
    name: sigil.name,
    category: sigil.category,
    description: sigil.description,
    iconUrl: sigil.iconUrl,
    createdAt: sigil.createdAt,
    updatedAt: sigil.updatedAt,
  };
}

export class D1BuildSigilRepository {
  async list(guildId: string): Promise<BuildSigil[]> {
    const db = getD1();
    const rows = await db
      .prepare(
        `SELECT id, name, category, description, icon_key,
                icon_content_type, created_at, updated_at
         FROM build_sigils
         WHERE guild_id = ?
         ORDER BY category ASC, created_at ASC`,
      )
      .bind(guildId)
      .all<BuildSigilRow>();

    return rows.results.map(mapSigil);
  }

  async get(
    guildId: string,
    id: string,
  ): Promise<StoredBuildSigil | null> {
    const db = getD1();
    const row = await db
      .prepare(
        `SELECT id, name, category, description, icon_key,
                icon_content_type, created_at, updated_at
         FROM build_sigils
         WHERE guild_id = ? AND id = ?
         LIMIT 1`,
      )
      .bind(guildId, id)
      .first<BuildSigilRow>();

    return row ? mapSigil(row) : null;
  }

  async create(input: {
    id: string;
    guildId: string;
    name: string;
    category: BuildSigilCategory;
    description: string;
    iconKey: string;
    iconContentType: string;
    createdByUserId: string;
    now: number;
  }): Promise<BuildSigil> {
    const db = getD1();
    await ensureBuildSigilsSchema(db);
    await db
      .prepare(
        `INSERT INTO build_sigils (
          id, guild_id, name, category, description, icon_key,
          icon_content_type, created_by_user_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        input.id,
        input.guildId,
        input.name,
        input.category,
        input.description,
        input.iconKey,
        input.iconContentType,
        input.createdByUserId,
        input.now,
        input.now,
      )
      .run();

    const created = await this.get(input.guildId, input.id);
    if (!created) {
      throw new Error("Created build sigil could not be loaded.");
    }
    return publicSigil(created);
  }

  async delete(
    guildId: string,
    id: string,
  ): Promise<StoredBuildSigil | null> {
    const db = getD1();
    await ensureBuildSigilsSchema(db);
    const sigil = await this.get(guildId, id);
    if (!sigil) {
      return null;
    }

    await db
      .prepare("DELETE FROM build_sigils WHERE guild_id = ? AND id = ?")
      .bind(guildId, id)
      .run();
    return sigil;
  }
}
