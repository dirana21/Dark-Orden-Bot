import type {
  BuildCharacterClass,
  BuildSkill,
} from "@/domain/build/model";
import { getD1 } from "@/infrastructure/db/d1";
import { ensureBuildSkillsSchema } from "@/infrastructure/db/ensure-build-skills-schema";

interface BuildSkillRow {
  id: string;
  character: BuildCharacterClass;
  name: string;
  description_html: string;
  icon_key: string;
  icon_content_type: string;
  created_at: number;
  updated_at: number;
}

export interface StoredBuildSkill extends BuildSkill {
  iconKey: string;
  iconContentType: string;
}

function mapSkill(row: BuildSkillRow): StoredBuildSkill {
  return {
    id: row.id,
    character: row.character,
    name: row.name,
    descriptionHtml: row.description_html,
    iconUrl: `/api/build/skill-icon?id=${encodeURIComponent(row.id)}`,
    iconKey: row.icon_key,
    iconContentType: row.icon_content_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function publicSkill(skill: StoredBuildSkill): BuildSkill {
  return {
    id: skill.id,
    character: skill.character,
    name: skill.name,
    descriptionHtml: skill.descriptionHtml,
    iconUrl: skill.iconUrl,
    createdAt: skill.createdAt,
    updatedAt: skill.updatedAt,
  };
}

export class D1BuildSkillRepository {
  async list(
    guildId: string,
    character: BuildCharacterClass,
  ): Promise<BuildSkill[]> {
    const db = getD1();
    await ensureBuildSkillsSchema(db);

    const rows = await db
      .prepare(
        `SELECT id, character, name, description_html, icon_key,
                icon_content_type, created_at, updated_at
         FROM build_skills
         WHERE guild_id = ? AND character = ?
         ORDER BY created_at ASC`,
      )
      .bind(guildId, character)
      .all<BuildSkillRow>();

    return rows.results.map(mapSkill);
  }

  async get(guildId: string, id: string): Promise<StoredBuildSkill | null> {
    const db = getD1();
    await ensureBuildSkillsSchema(db);

    const row = await db
      .prepare(
        `SELECT id, character, name, description_html, icon_key,
                icon_content_type, created_at, updated_at
         FROM build_skills
         WHERE guild_id = ? AND id = ?
         LIMIT 1`,
      )
      .bind(guildId, id)
      .first<BuildSkillRow>();

    return row ? mapSkill(row) : null;
  }

  async create(input: {
    id: string;
    guildId: string;
    character: BuildCharacterClass;
    name: string;
    descriptionHtml: string;
    iconKey: string;
    iconContentType: string;
    createdByUserId: string;
    now: number;
  }): Promise<BuildSkill> {
    const db = getD1();
    await ensureBuildSkillsSchema(db);

    await db
      .prepare(
        `INSERT INTO build_skills (
          id, guild_id, character, name, description_html, icon_key,
          icon_content_type, created_by_user_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        input.id,
        input.guildId,
        input.character,
        input.name,
        input.descriptionHtml,
        input.iconKey,
        input.iconContentType,
        input.createdByUserId,
        input.now,
        input.now,
      )
      .run();

    const created = await this.get(input.guildId, input.id);
    if (!created) {
      throw new Error("Created build skill could not be loaded.");
    }
    return publicSkill(created);
  }

  async delete(guildId: string, id: string): Promise<StoredBuildSkill | null> {
    const db = getD1();
    await ensureBuildSkillsSchema(db);
    const skill = await this.get(guildId, id);
    if (!skill) {
      return null;
    }

    await db
      .prepare("DELETE FROM build_skills WHERE guild_id = ? AND id = ?")
      .bind(guildId, id)
      .run();

    return skill;
  }
}
