import type { EventRole, EventSessionNumber } from "@/domain/events/model";
import type { VengefulSoulsPlayerScore } from "@/domain/vengeful-souls/model";
import type { VengefulSoulsRepository } from "@/domain/vengeful-souls/ports";
import { getD1 } from "@/infrastructure/db/d1";
import { ensureVengefulSoulsSchema } from "@/infrastructure/db/ensure-vengeful-souls-schema";

interface VengefulSoulsRow {
  user_id: string;
  display_name: string;
  event_role: EventRole | null;
  points: number;
  updated_at: number | null;
}

export class D1VengefulSoulsRepository
  implements VengefulSoulsRepository
{
  async listGuildScores(
    guildId: string,
    sessionNumber: EventSessionNumber,
  ): Promise<VengefulSoulsPlayerScore[]> {
    const db = getD1();
    await ensureVengefulSoulsSchema(db);

    const rows = await db
      .prepare(
        `SELECT
          users.id AS user_id,
          users.display_name,
          vengeful_souls_scores.event_role,
          COALESCE(vengeful_souls_scores.points, 0) AS points,
          vengeful_souls_scores.updated_at
        FROM users
        LEFT JOIN vengeful_souls_scores
          ON vengeful_souls_scores.user_id = users.id
          AND vengeful_souls_scores.session_number = ?
        WHERE users.guild_id = ? AND users.is_hidden = 0
        ORDER BY
          COALESCE(vengeful_souls_scores.points, 0) DESC,
          CASE WHEN vengeful_souls_scores.updated_at IS NULL THEN 1 ELSE 0 END,
          vengeful_souls_scores.updated_at ASC,
          users.display_name COLLATE NOCASE ASC
        LIMIT 50`,
      )
      .bind(sessionNumber, guildId)
      .all<VengefulSoulsRow>();

    return rows.results.map((row) => ({
      userId: row.user_id,
      displayName: row.display_name,
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
    await ensureVengefulSoulsSchema(db);

    const result = await db
      .prepare(
        `INSERT INTO vengeful_souls_scores
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
    await ensureVengefulSoulsSchema(db);

    const result = await db
      .prepare(
        `INSERT INTO vengeful_souls_scores
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
