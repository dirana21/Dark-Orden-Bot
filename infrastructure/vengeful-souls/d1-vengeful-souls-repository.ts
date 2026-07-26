import type { GuildRole } from "@/domain/auth/model";
import type { VengefulSoulsPlayerScore } from "@/domain/vengeful-souls/model";
import type { VengefulSoulsRepository } from "@/domain/vengeful-souls/ports";
import { getD1 } from "@/infrastructure/db/d1";
import { ensureVengefulSoulsSchema } from "@/infrastructure/db/ensure-vengeful-souls-schema";

interface VengefulSoulsRow {
  user_id: string;
  display_name: string;
  role: GuildRole;
  points: number;
  updated_at: number | null;
}

export class D1VengefulSoulsRepository
  implements VengefulSoulsRepository
{
  async listGuildScores(
    guildId: string,
  ): Promise<VengefulSoulsPlayerScore[]> {
    const db = getD1();
    await ensureVengefulSoulsSchema(db);

    const rows = await db
      .prepare(
        `SELECT
          users.id AS user_id,
          users.display_name,
          users.role,
          COALESCE(vengeful_souls_scores.points, 0) AS points,
          vengeful_souls_scores.updated_at
        FROM users
        LEFT JOIN vengeful_souls_scores
          ON vengeful_souls_scores.user_id = users.id
        WHERE users.guild_id = ? AND users.is_hidden = 0
        ORDER BY
          COALESCE(vengeful_souls_scores.points, 0) DESC,
          CASE WHEN vengeful_souls_scores.updated_at IS NULL THEN 1 ELSE 0 END,
          vengeful_souls_scores.updated_at ASC,
          users.display_name COLLATE NOCASE ASC
        LIMIT 50`,
      )
      .bind(guildId)
      .all<VengefulSoulsRow>();

    return rows.results.map((row) => ({
      userId: row.user_id,
      displayName: row.display_name,
      role: row.role,
      points: row.points,
      updatedAt: row.updated_at,
    }));
  }

  async savePlayerScore(
    userId: string,
    guildId: string,
    points: number,
    updatedAt: number,
  ): Promise<boolean> {
    const db = getD1();
    await ensureVengefulSoulsSchema(db);

    const result = await db
      .prepare(
        `INSERT INTO vengeful_souls_scores
          (user_id, guild_id, points, updated_at)
         SELECT id, guild_id, ?, ?
         FROM users
         WHERE id = ? AND guild_id = ? AND is_hidden = 0
         ON CONFLICT(user_id) DO UPDATE SET
           guild_id = excluded.guild_id,
           points = excluded.points,
           updated_at = excluded.updated_at`,
      )
      .bind(points, updatedAt, userId, guildId)
      .run();

    return result.meta.changes > 0;
  }
}
