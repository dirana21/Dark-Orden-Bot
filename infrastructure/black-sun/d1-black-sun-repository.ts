import type { GuildRole } from "@/domain/auth/model";
import type { BlackSunPlayerScore } from "@/domain/black-sun/model";
import type { BlackSunRepository } from "@/domain/black-sun/ports";
import { getD1 } from "@/infrastructure/db/d1";
import { ensureBlackSunSchema } from "@/infrastructure/db/ensure-black-sun-schema";

interface BlackSunRow {
  user_id: string;
  display_name: string;
  role: GuildRole;
  points: number;
  updated_at: number | null;
}

export class D1BlackSunRepository implements BlackSunRepository {
  async listGuildScores(guildId: string): Promise<BlackSunPlayerScore[]> {
    const db = getD1();
    await ensureBlackSunSchema(db);

    const rows = await db
      .prepare(
        `SELECT
          users.id AS user_id,
          users.display_name,
          users.role,
          COALESCE(black_sun_scores.points, 0) AS points,
          black_sun_scores.updated_at
        FROM users
        LEFT JOIN black_sun_scores
          ON black_sun_scores.user_id = users.id
        WHERE users.guild_id = ? AND users.is_hidden = 0
        ORDER BY
          COALESCE(black_sun_scores.points, 0) DESC,
          CASE WHEN black_sun_scores.updated_at IS NULL THEN 1 ELSE 0 END,
          black_sun_scores.updated_at ASC,
          users.display_name COLLATE NOCASE ASC
        LIMIT 50`,
      )
      .bind(guildId)
      .all<BlackSunRow>();

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
    await ensureBlackSunSchema(db);

    const result = await db
      .prepare(
        `INSERT INTO black_sun_scores (user_id, guild_id, points, updated_at)
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
