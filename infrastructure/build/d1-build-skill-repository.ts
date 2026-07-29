import type {
  BuildCharacterClass,
  BuildSkill,
  BuildSkillSlotType,
} from "@/domain/build/model";
import { getD1 } from "@/infrastructure/db/d1";
import { ensureBuildSkillsSchema } from "@/infrastructure/db/ensure-build-skills-schema";

interface BuildSkillRow {
  id: string;
  character: BuildCharacterClass;
  slot_type: BuildSkillSlotType;
  slot_index: number;
  name: string;
  description_html: string;
  icon_key: string;
  icon_content_type: string;
  combo_available: number;
  combo_enabled: number;
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
    slotType: row.slot_type,
    slotIndex: row.slot_index,
    name: row.name,
    descriptionHtml: row.description_html,
    iconUrl: `/api/build/skill-icon?id=${encodeURIComponent(row.id)}&v=${row.updated_at}`,
    iconKey: row.icon_key,
    iconContentType: row.icon_content_type,
    comboAvailable: Boolean(row.combo_available),
    comboEnabled: Boolean(row.combo_enabled),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function publicSkill(skill: StoredBuildSkill): BuildSkill {
  return {
    id: skill.id,
    character: skill.character,
    slotType: skill.slotType,
    slotIndex: skill.slotIndex,
    name: skill.name,
    descriptionHtml: skill.descriptionHtml,
    iconUrl: skill.iconUrl,
    comboAvailable: skill.comboAvailable,
    comboEnabled: skill.comboEnabled,
    createdAt: skill.createdAt,
    updatedAt: skill.updatedAt,
  };
}

export class D1BuildSkillRepository {
  async list(
    guildId: string,
    userId: string,
    character: BuildCharacterClass,
  ): Promise<BuildSkill[]> {
    const db = getD1();
    await ensureBuildSkillsSchema(db);

    const rows = await db
      .prepare(
        `SELECT skills.id, skills.character, skills.slot_type,
                skills.slot_index, skills.name,
                skills.description_html, skills.icon_key,
                skills.icon_content_type, skills.combo_available,
                COALESCE(settings.combo_enabled, 0) AS combo_enabled,
                skills.created_at, skills.updated_at
         FROM build_skills AS skills
         LEFT JOIN user_build_skill_settings AS settings
           ON settings.skill_id = skills.id AND settings.user_id = ?
         WHERE skills.guild_id = ? AND skills.character = ?
         ORDER BY CASE skills.slot_type WHEN 'rabam' THEN 0 ELSE 1 END,
                  skills.slot_index ASC`,
      )
      .bind(userId, guildId, character)
      .all<BuildSkillRow>();

    return rows.results.map(mapSkill);
  }

  async get(guildId: string, id: string): Promise<StoredBuildSkill | null> {
    const db = getD1();
    await ensureBuildSkillsSchema(db);

    const row = await db
      .prepare(
        `SELECT id, character, slot_type, slot_index, name,
                description_html, icon_key,
                icon_content_type, combo_available, 0 AS combo_enabled,
                created_at, updated_at
         FROM build_skills
         WHERE guild_id = ? AND id = ?
         LIMIT 1`,
      )
      .bind(guildId, id)
      .first<BuildSkillRow>();

    return row ? mapSkill(row) : null;
  }

  async getBySlot(
    guildId: string,
    character: BuildCharacterClass,
    slotType: BuildSkillSlotType,
    slotIndex: number,
  ): Promise<StoredBuildSkill | null> {
    const db = getD1();
    await ensureBuildSkillsSchema(db);

    const row = await db
      .prepare(
        `SELECT id, character, slot_type, slot_index, name,
                description_html, icon_key, icon_content_type,
                combo_available, 0 AS combo_enabled, created_at, updated_at
         FROM build_skills
         WHERE guild_id = ? AND character = ?
           AND slot_type = ? AND slot_index = ?
         LIMIT 1`,
      )
      .bind(guildId, character, slotType, slotIndex)
      .first<BuildSkillRow>();

    return row ? mapSkill(row) : null;
  }

  async create(input: {
    id: string;
    guildId: string;
    character: BuildCharacterClass;
    slotType: BuildSkillSlotType;
    slotIndex: number;
    name: string;
    descriptionHtml: string;
    iconKey: string;
    iconContentType: string;
    comboAvailable: boolean;
    createdByUserId: string;
    now: number;
  }): Promise<BuildSkill> {
    const db = getD1();
    await ensureBuildSkillsSchema(db);

    await db
      .prepare(
        `INSERT INTO build_skills (
          id, guild_id, character, slot_type, slot_index, name,
          description_html, icon_key,
          icon_content_type, combo_available, created_by_user_id,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        input.id,
        input.guildId,
        input.character,
        input.slotType,
        input.slotIndex,
        input.name,
        input.descriptionHtml,
        input.iconKey,
        input.iconContentType,
        input.comboAvailable ? 1 : 0,
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

  async update(input: {
    guildId: string;
    id: string;
    name: string;
    descriptionHtml: string;
    comboAvailable: boolean;
    iconKey?: string;
    iconContentType?: string;
    viewerUserId: string;
    now: number;
  }): Promise<BuildSkill | null> {
    const db = getD1();
    await ensureBuildSkillsSchema(db);

    const result = await db
      .prepare(
        `UPDATE build_skills
         SET name = ?,
             description_html = ?,
             icon_key = COALESCE(?, icon_key),
             icon_content_type = COALESCE(?, icon_content_type),
             combo_available = ?,
             updated_at = ?
         WHERE guild_id = ? AND id = ?`,
      )
      .bind(
        input.name,
        input.descriptionHtml,
        input.iconKey ?? null,
        input.iconContentType ?? null,
        input.comboAvailable ? 1 : 0,
        input.now,
        input.guildId,
        input.id,
      )
      .run();

    if (!result.meta.changes) {
      return null;
    }

    if (!input.comboAvailable) {
      await db
        .prepare("DELETE FROM user_build_skill_settings WHERE skill_id = ?")
        .bind(input.id)
        .run();
    }

    const updated = await this.getForUser(
      input.guildId,
      input.viewerUserId,
      input.id,
    );
    return updated ? publicSkill(updated) : null;
  }

  async setCombo(
    guildId: string,
    userId: string,
    id: string,
    enabled: boolean,
    now: number,
  ): Promise<BuildSkill | null> {
    const db = getD1();
    await ensureBuildSkillsSchema(db);
    const skill = await this.getForUser(guildId, userId, id);
    if (!skill || !skill.comboAvailable) {
      return null;
    }

    await db
      .prepare(
        `INSERT INTO user_build_skill_settings (
          skill_id, user_id, combo_enabled, updated_at
        ) VALUES (?, ?, ?, ?)
        ON CONFLICT(skill_id, user_id) DO UPDATE SET
          combo_enabled = excluded.combo_enabled,
          updated_at = excluded.updated_at`,
      )
      .bind(id, userId, enabled ? 1 : 0, now)
      .run();

    const updated = await this.getForUser(guildId, userId, id);
    return updated ? publicSkill(updated) : null;
  }

  private async getForUser(
    guildId: string,
    userId: string,
    id: string,
  ): Promise<StoredBuildSkill | null> {
    const db = getD1();
    await ensureBuildSkillsSchema(db);
    const row = await db
      .prepare(
        `SELECT skills.id, skills.character, skills.slot_type,
                skills.slot_index, skills.name,
                skills.description_html, skills.icon_key,
                skills.icon_content_type, skills.combo_available,
                COALESCE(settings.combo_enabled, 0) AS combo_enabled,
                skills.created_at, skills.updated_at
         FROM build_skills AS skills
         LEFT JOIN user_build_skill_settings AS settings
           ON settings.skill_id = skills.id AND settings.user_id = ?
         WHERE skills.guild_id = ? AND skills.id = ?
         LIMIT 1`,
      )
      .bind(userId, guildId, id)
      .first<BuildSkillRow>();

    return row ? mapSkill(row) : null;
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
