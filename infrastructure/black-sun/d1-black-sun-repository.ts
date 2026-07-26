import type { BlackSunPlayerScore } from "@/domain/black-sun/model";
import type { BlackSunRepository } from "@/domain/black-sun/ports";
import type { EventRole, EventSessionNumber } from "@/domain/events/model";
import { getD1 } from "@/infrastructure/db/d1";
import { ensureBlackSunSchema } from "@/infrastructure/db/ensure-black-sun-schema";

interface BlackSunRow {
  user_id: string;
  display_name: string;
  discord_user_id: string | null;
  discord_avatar_hash: string | null;
  event_role: EventRole | null;
  points: number;
  updated_at: number | null;
}

export class D1BlackSunRepository implements BlackSunRepository {
  async listGuildScores(
    guildId: string,
    sessionNumber: EventSessionNumber,
  ): Promise<BlackSunPlayerScore[]> {
    const db = getD1();
    await ensureBlackSunSchema(db);

    const rows = await db
      .prepare(
        `SELECT
          users.id AS user_id,
          users.display_name,
          users.discord_user_id,
          users.discord_avatar_hash,
          black_sun_scores.event_role,
          COALESCE(black_sun_scores.points, 0) AS points,
          black_sun_scores.updated_at
        FROM users
        LEFT JOIN black_sun_scores
          ON black_sun_scores.user_id = users.id
          AND black_sun_scores.session_number = ?
        WHERE users.guild_id = ? AND users.is_hidden = 0
        ORDER BY
          COALESCE(black_sun_scores.points, 0) DESC,
          CASE WHEN black_sun_scores.updated_at IS NULL THEN 1 ELSE 0 END,
          black_sun_scores.updated_at ASC,
          users.display_name COLLATE NOCASE ASC
        LIMIT 50`,
      )
      .bind(sessionNumber, guildId)
      .all<BlackSunRow>();

    return rows.results.map((row) => ({
      userId: row.user_id,
      displayName: row.display_name,
      avatarUrl:
        row.discord_user_id && row.discord_avatar_hash
          ? `https://cdn.discordapp.com/avatars/${encodeURIComponent(row.discord_user_id)}/${encodeURIComponent(row.discord_avatar_hash)}.webp?size=128`
          : null,
      eventRole: row.event_role,
      points: row.points,
      updatedAt: row.updated_at,
    }));
  }

  async savePlayerScore(
    userId: string,
    guildId: string,
    sessionNumber: EventSessionNumber,
    points: number,
    updatedAt: number,
  ): Promise<boolean> {
    const db = getD1();
    await ensureBlackSunSchema(db);

    const result = await db
      .prepare(
        `INSERT INTO black_sun_scores
          (user_id, guild_id, session_number, event_role, points, updated_at)
         SELECT id, guild_id, ?, NULL, ?, ?
         FROM users
         WHERE id = ? AND guild_id = ? AND is_hidden = 0
         ON CONFLICT(user_id, session_number) DO UPDATE SET
           guild_id = excluded.guild_id,
           points = excluded.points,
           updated_at = excluded.updated_at`,
      )
      .bind(sessionNumber, points, updatedAt, userId, guildId)
      .run();

    return result.meta.changes > 0;
  }

  async savePlayerRole(
    userId: string,
    guildId: string,
    sessionNumber: EventSessionNumber,
    role: EventRole,
  ): Promise<boolean> {
    const db = getD1();
    await ensureBlackSunSchema(db);

    const result = await db
      .prepare(
        `INSERT INTO black_sun_scores
          (user_id, guild_id, session_number, event_role, points, updated_at)
         SELECT id, guild_id, ?, ?, 0, NULL
         FROM users
         WHERE id = ? AND guild_id = ? AND is_hidden = 0
         ON CONFLICT(user_id, session_number) DO UPDATE SET
           guild_id = excluded.guild_id,
           event_role = excluded.event_role`,
      )
      .bind(sessionNumber, role, userId, guildId)
      .run();

    return result.meta.changes > 0;
  }
}
