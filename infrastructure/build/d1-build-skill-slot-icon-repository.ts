import type {
  BuildCharacterClass,
  BuildSkillSlotIcon,
  BuildSkillSlotType,
} from "@/domain/build/model";
import { getD1 } from "@/infrastructure/db/d1";
import { ensureBuildSkillsSchema } from "@/infrastructure/db/ensure-build-skills-schema";

interface SlotIconRow {
  character: string;
  slot_type: BuildSkillSlotType;
  slot_index: number;
  icon_key: string;
  icon_content_type: string;
  alternate_icon_key: string | null;
  alternate_icon_content_type: string | null;
  updated_at: number;
}

export interface StoredBuildSkillSlotIcon extends BuildSkillSlotIcon {
  iconKey: string;
  iconContentType: string;
  alternateIconKey: string | null;
  alternateIconContentType: string | null;
}

function mapIcon(row: SlotIconRow): StoredBuildSkillSlotIcon {
  return {
    character: row.character,
    slotType: row.slot_type,
    slotIndex: row.slot_index,
    iconUrl: `/api/build/skill-slot-icon?character=${encodeURIComponent(row.character)}&slotType=${row.slot_type}&slotIndex=${row.slot_index}&v=${row.updated_at}`,
    alternateIconUrl: row.alternate_icon_key
      ? `/api/build/skill-slot-icon?character=${encodeURIComponent(row.character)}&slotType=${row.slot_type}&slotIndex=${row.slot_index}&variant=alternate&v=${row.updated_at}`
      : null,
    iconKey: row.icon_key,
    iconContentType: row.icon_content_type,
    alternateIconKey: row.alternate_icon_key,
    alternateIconContentType: row.alternate_icon_content_type,
    updatedAt: row.updated_at,
  };
}

export class D1BuildSkillSlotIconRepository {
  async list(guildId: string, character: BuildCharacterClass): Promise<BuildSkillSlotIcon[]> {
    const db = getD1();
    await ensureBuildSkillsSchema(db);
    const rows = await db.prepare(
      `SELECT character, slot_type, slot_index, icon_key, icon_content_type,
              alternate_icon_key, alternate_icon_content_type, updated_at
       FROM build_skill_slot_icons
       WHERE guild_id = ? AND character = ?
       ORDER BY CASE slot_type WHEN 'rabam' THEN 0 ELSE 1 END, slot_index`,
    ).bind(guildId, character).all<SlotIconRow>();
    return rows.results.map(mapIcon);
  }

  async get(guildId: string, character: BuildCharacterClass, slotType: BuildSkillSlotType, slotIndex: number): Promise<StoredBuildSkillSlotIcon | null> {
    const db = getD1();
    await ensureBuildSkillsSchema(db);
    const row = await db.prepare(
      `SELECT character, slot_type, slot_index, icon_key, icon_content_type,
              alternate_icon_key, alternate_icon_content_type, updated_at
       FROM build_skill_slot_icons
       WHERE guild_id = ? AND character = ? AND slot_type = ? AND slot_index = ? LIMIT 1`,
    ).bind(guildId, character, slotType, slotIndex).first<SlotIconRow>();
    return row ? mapIcon(row) : null;
  }

  async upsert(input: { guildId: string; character: BuildCharacterClass; slotType: BuildSkillSlotType; slotIndex: number; iconKey: string; iconContentType: string; createdByUserId: string; now: number }): Promise<BuildSkillSlotIcon> {
    const db = getD1();
    await ensureBuildSkillsSchema(db);
    await db.prepare(
      `INSERT INTO build_skill_slot_icons (guild_id, character, slot_type, slot_index, icon_key, icon_content_type, created_by_user_id, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(guild_id, character, slot_type, slot_index) DO UPDATE SET
         icon_key = excluded.icon_key,
         icon_content_type = excluded.icon_content_type,
         created_by_user_id = excluded.created_by_user_id,
         updated_at = excluded.updated_at`,
    ).bind(input.guildId, input.character, input.slotType, input.slotIndex, input.iconKey, input.iconContentType, input.createdByUserId, input.now).run();
    const saved = await this.get(input.guildId, input.character, input.slotType, input.slotIndex);
    if (!saved) throw new Error("Saved slot icon could not be loaded.");
    return {
      character: saved.character,
      slotType: saved.slotType,
      slotIndex: saved.slotIndex,
      iconUrl: saved.iconUrl,
      alternateIconUrl: saved.alternateIconUrl,
      updatedAt: saved.updatedAt,
    };
  }

  async setAlternate(input: { guildId: string; character: BuildCharacterClass; slotType: BuildSkillSlotType; slotIndex: number; iconKey: string; iconContentType: string; now: number }): Promise<BuildSkillSlotIcon> {
    const db = getD1();
    await ensureBuildSkillsSchema(db);
    const result = await db.prepare(
      `UPDATE build_skill_slot_icons
       SET alternate_icon_key = ?, alternate_icon_content_type = ?, updated_at = ?
       WHERE guild_id = ? AND character = ? AND slot_type = ? AND slot_index = ?`,
    ).bind(input.iconKey, input.iconContentType, input.now, input.guildId, input.character, input.slotType, input.slotIndex).run();
    if (!result.meta.changes) throw new Error("Primary slot icon must be uploaded first.");
    const saved = await this.get(input.guildId, input.character, input.slotType, input.slotIndex);
    if (!saved) throw new Error("Saved alternate slot icon could not be loaded.");
    return { character: saved.character, slotType: saved.slotType, slotIndex: saved.slotIndex, iconUrl: saved.iconUrl, alternateIconUrl: saved.alternateIconUrl, updatedAt: saved.updatedAt };
  }

  async delete(guildId: string, character: BuildCharacterClass, slotType: BuildSkillSlotType, slotIndex: number): Promise<StoredBuildSkillSlotIcon | null> {
    const current = await this.get(guildId, character, slotType, slotIndex);
    if (!current) return null;
    await getD1().prepare(
      `DELETE FROM build_skill_slot_icons WHERE guild_id = ? AND character = ? AND slot_type = ? AND slot_index = ?`,
    ).bind(guildId, character, slotType, slotIndex).run();
    return current;
  }
}
